import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatStepper, MatStepperModule } from '@angular/material/stepper';

import _ from 'lodash';

import { Store } from '@ngxs/store';
import { EMPTY, finalize, switchMap, take } from 'rxjs';

import { Result } from '../../../../../../core/result';
import { PaymentsHistoryProvider } from '../../../../../../data/providers/accounting/payments-history.provider';
import { CurrencyExchangeService } from '../../../../../../data/providers/rates/currency-exchange.service';
import { AccountTypes } from '../../../../../../domain/models/accounting/account-types';
import { ICrossAccountsTransferModel } from '../../../../../../domain/models/accounting/cross-accounts-transfer.model';
import { IPaymentAccountModel } from '../../../../../../domain/models/accounting/payment-account.model';
import { ICrossAccountsTransferResponse } from '../../../../../../domain/models/accounting/responses/cross-accounts-transfer.response';
import { OperationTypes } from '../../../../../../domain/types/operation.types';
import { DialogContainer } from '../../../models/dialog-container';
import { Add } from '../../../store/states/accounting/actions/payment-operation.actions';
import {
	getActivePaymentAccount,
	getActivePaymentAccountId,
	getPaymentAccounts,
} from '../../../store/states/accounting/selectors/payment-account.selector';
import { ProgressBarComponent } from '../../progress-bar/progress-bar.component';

type TransferDirection = 'In' | 'Out';

type TransferDetailsFormControls = {
	transferDirection: FormControl<TransferDirection>;
	targetAccountId: FormControl<string | null>;
	operationDate: FormControl<Date | null>;
	transferAmount: FormControl<number | null>;
};

const requiredTransferField: ValidatorFn = control => Validators.required(control);

@Component({
	selector: 'cross-accounts-transfer-dialog',
	templateUrl: './cross-accounts-transfer-dialog.component.html',
	styleUrls: ['./cross-accounts-transfer-dialog.component.css'],
	changeDetection: ChangeDetectionStrategy.OnPush,
	standalone: true,
	imports: [
		DatePipe,
		MatButtonModule,
		MatButtonToggleModule,
		MatDatepickerModule,
		MatDialogModule,
		MatDividerModule,
		MatFormFieldModule,
		MatIconModule,
		MatInputModule,
		MatNativeDateModule,
		MatSelectModule,
		MatStepperModule,
		ProgressBarComponent,
		ReactiveFormsModule,
	],
})
export class CrossAccountsTransferDialogComponent {
	private readonly store = inject(Store);
	private readonly exchangeService = inject(CurrencyExchangeService);
	private readonly paymentHistoryService = inject(PaymentsHistoryProvider);
	private readonly dialogRef = inject(MatDialogRef<CrossAccountsTransferDialogComponent>);
	private readonly dialogConfiguration =
		inject<DialogContainer<ICrossAccountsTransferModel, Result<ICrossAccountsTransferResponse>>>(MAT_DIALOG_DATA);

	public readonly title = this.dialogConfiguration.title;
	public readonly isLoadingSignal = signal(false);
	public readonly isPreparingSignal = signal(false);
	public readonly selectedStepIndexSignal = signal(0);
	public readonly errorMessageSignal = signal('');
	public readonly currencyMultiplierSignal = signal<number | null>(null);
	public readonly transferDetailsStepFg = new FormGroup<TransferDetailsFormControls>({
		transferDirection: new FormControl<TransferDirection>('In', {
			nonNullable: true,
			validators: requiredTransferField,
		}),
		targetAccountId: new FormControl<string | null>(null, requiredTransferField),
		operationDate: new FormControl<Date | null>(new Date(), requiredTransferField),
		transferAmount: new FormControl<number | null>(null, requiredTransferField),
	});
	public readonly paymentAccountsSignal = toSignal(this.store.select(getPaymentAccounts), { initialValue: [] });
	public readonly activePaymentAccountIdSignal = toSignal(this.store.select(getActivePaymentAccountId), {
		initialValue: '',
	});
	public readonly activePaymentAccountSignal = toSignal(this.store.select(getActivePaymentAccount), {
		initialValue: undefined,
	});
	public readonly transferDirectionSignal = toSignal(
		this.transferDetailsStepFg.controls.transferDirection.valueChanges,
		{
			initialValue: this.transferDetailsStepFg.controls.transferDirection.value,
		}
	);
	public readonly targetAccountIdSignal = toSignal(this.transferDetailsStepFg.controls.targetAccountId.valueChanges, {
		initialValue: this.transferDetailsStepFg.controls.targetAccountId.value,
	});
	public readonly operationDateSignal = toSignal(this.transferDetailsStepFg.controls.operationDate.valueChanges, {
		initialValue: this.transferDetailsStepFg.controls.operationDate.value,
	});
	public readonly transferAmountSignal = toSignal(this.transferDetailsStepFg.controls.transferAmount.valueChanges, {
		initialValue: this.transferDetailsStepFg.controls.transferAmount.value,
	});
	public readonly counterpartAccountSignal = computed(() =>
		this.paymentAccountsSignal().find(account => account.key?.toString() === this.targetAccountIdSignal())
	);
	public readonly availableAccountsSignal = computed(() =>
		this.paymentAccountsSignal().filter(account => account.key?.toString() !== this.activePaymentAccountIdSignal())
	);
	public readonly isSendingFromActiveAccountSignal = computed(() => this.transferDirectionSignal() === 'In');
	public readonly fromAccountSignal = computed(() =>
		this.isSendingFromActiveAccountSignal() ? this.activePaymentAccountSignal() : this.counterpartAccountSignal()
	);
	public readonly toAccountSignal = computed(() =>
		this.isSendingFromActiveAccountSignal() ? this.counterpartAccountSignal() : this.activePaymentAccountSignal()
	);
	public readonly counterpartAccountLabelSignal = computed(() =>
		this.isSendingFromActiveAccountSignal() ? 'Transfer to *' : 'Transfer from *'
	);
	public readonly destinationAmountSignal = computed(() => {
		const amount = this.transferAmountSignal();
		const multiplier = this.currencyMultiplierSignal();

		return amount === null || multiplier === null ? null : _.round(amount * multiplier, 3);
	});

	public close(): void {
		this.dialogRef.close();
	}

	public next(stepper: MatStepper): void {
		if (this.isPreparingSignal() || this.transferDetailsStepFg.invalid) {
			this.transferDetailsStepFg.markAllAsTouched();
			return;
		}

		const sourceAccount = this.fromAccountSignal();
		const destinationAccount = this.toAccountSignal();
		const operationDate = this.operationDateSignal();

		if (!sourceAccount || !destinationAccount || !operationDate) {
			this.transferDetailsStepFg.markAllAsTouched();
			return;
		}

		this.errorMessageSignal.set('');
		this.isPreparingSignal.set(true);
		this.exchangeService
			.getExchangeMultiplier({
				originCurrency: sourceAccount.currency,
				targetCurrency: destinationAccount.currency,
				operationDate,
			})
			.pipe(
				take(1),
				finalize(() => this.isPreparingSignal.set(false))
			)
			.subscribe({
				next: response => {
					if (!response.isSucceeded) {
						this.errorMessageSignal.set('Unable to prepare the transfer. Please try again.');
						return;
					}

					this.currencyMultiplierSignal.set(response.payload);
					stepper.next();
				},
				error: () => this.errorMessageSignal.set('Unable to prepare the transfer. Please try again.'),
			});
	}

	public previous(stepper: MatStepper): void {
		stepper.previous();
	}

	public applyTransfer(): void {
		if (this.isLoadingSignal()) {
			return;
		}

		const transfer = this.createTransfer();

		if (!transfer) {
			this.transferDetailsStepFg.markAllAsTouched();
			return;
		}

		this.errorMessageSignal.set('');
		this.isLoadingSignal.set(true);
		this.dialogConfiguration
			.onSubmit(transfer)
			.pipe(
				take(1),
				switchMap(response => {
					if (!response.isSucceeded) {
						this.errorMessageSignal.set('Unable to complete the transfer. Please try again.');
						return EMPTY;
					}

					const activePaymentAccountId = this.activePaymentAccountSignal()?.key;

					if (!activePaymentAccountId) {
						this.errorMessageSignal.set('Unable to complete the transfer. Please try again.');
						return EMPTY;
					}

					return this.paymentHistoryService.GetHistoryOperationById(
						activePaymentAccountId,
						response.payload.paymentOperationId
					);
				}),
				finalize(() => this.isLoadingSignal.set(false))
			)
			.subscribe({
				next: operationHistoryRecord => {
					const transferOperation = operationHistoryRecord.record;
					transferOperation.operationType = OperationTypes.Transfer;
					this.store.dispatch(new Add(transferOperation));
					this.dialogRef.close();
				},
				error: () => this.errorMessageSignal.set('Unable to complete the transfer. Please try again.'),
			});
	}

	public getAccountLabel(account: IPaymentAccountModel): string {
		return `${account.emitter} · ${account.description} · ${account.currency}`;
	}

	public getAccountTypeLabel(account: IPaymentAccountModel): string {
		return account.type === AccountTypes.WalletCache ? 'Wallet / cash' : AccountTypes[account.type];
	}

	private createTransfer(): ICrossAccountsTransferModel | undefined {
		const sender = this.fromAccountSignal()?.key;
		const recipient = this.toAccountSignal()?.key;
		const amount = this.transferAmountSignal();
		const multiplier = this.currencyMultiplierSignal();
		const operationAt = this.operationDateSignal();

		if (!sender || !recipient || amount === null || multiplier === null || !operationAt) {
			return undefined;
		}

		return { sender, recipient, amount, multiplier, operationAt };
	}
}
