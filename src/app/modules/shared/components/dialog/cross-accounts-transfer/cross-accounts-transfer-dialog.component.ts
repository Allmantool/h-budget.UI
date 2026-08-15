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
import { finalize, take } from 'rxjs';

import { Result } from '../../../../../../core/result';
import { CurrencyExchangeService } from '../../../../../../data/providers/rates/currency-exchange.service';
import { AccountTypes } from '../../../../../../domain/models/accounting/account-types';
import { ICrossAccountsTransferModel } from '../../../../../../domain/models/accounting/cross-accounts-transfer.model';
import { IPaymentAccountModel } from '../../../../../../domain/models/accounting/payment-account.model';
import { ICrossAccountsTransferResponse } from '../../../../../../domain/models/accounting/responses/cross-accounts-transfer.response';
import { DialogContainer } from '../../../models/dialog-container';
import {
	getActivePaymentAccount,
	getActivePaymentAccountId,
	getPaymentAccounts,
} from '../../../store/states/accounting/selectors/payment-account.selector';
import { ProgressBarComponent } from '../../progress-bar/progress-bar.component';

type TransferDirection = 'In' | 'Out';
type ExchangeRateMode = 'Automatic' | 'Custom';

type TransferDetailsFormControls = {
	transferDirection: FormControl<TransferDirection>;
	targetAccountId: FormControl<string | null>;
	operationDate: FormControl<Date | null>;
	transferAmount: FormControl<number | null>;
	rateMode: FormControl<ExchangeRateMode>;
	customConversionMultiplier: FormControl<number | null>;
};

const requiredTransferField: ValidatorFn = control => Validators.required(control);
const positiveFiniteNumber: ValidatorFn = control =>
	typeof control.value === 'number' && Number.isFinite(control.value) && control.value > 0
		? null
		: { positiveFiniteNumber: true };

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
	private automaticRateRequestVersion = 0;
	private readonly store = inject(Store);
	private readonly exchangeService = inject(CurrencyExchangeService);
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
		rateMode: new FormControl<ExchangeRateMode>('Automatic', { nonNullable: true }),
		customConversionMultiplier: new FormControl<number | null>(
			{ value: null, disabled: true },
			positiveFiniteNumber
		),
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
	public readonly rateModeSignal = toSignal(this.transferDetailsStepFg.controls.rateMode.valueChanges, {
		initialValue: this.transferDetailsStepFg.controls.rateMode.value,
	});
	public readonly customConversionMultiplierSignal = toSignal(
		this.transferDetailsStepFg.controls.customConversionMultiplier.valueChanges,
		{ initialValue: this.transferDetailsStepFg.controls.customConversionMultiplier.value }
	);
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
	public readonly isCrossCurrencyTransferSignal = computed(() => {
		const fromAccount = this.fromAccountSignal();
		const toAccount = this.toAccountSignal();

		return !!fromAccount && !!toAccount && fromAccount.currency !== toAccount.currency;
	});
	public readonly isCustomRateModeSignal = computed(() => this.rateModeSignal() === 'Custom');
	public readonly effectiveMultiplierSignal = computed(() =>
		this.isCustomRateModeSignal() ? this.customConversionMultiplierSignal() : this.currencyMultiplierSignal()
	);
	public readonly destinationAmountSignal = computed(() => {
		const amount = this.transferAmountSignal();
		const multiplier = this.effectiveMultiplierSignal();

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
		if (sourceAccount.currency === destinationAccount.currency) {
			this.currencyMultiplierSignal.set(1);
			stepper.next();
			return;
		}

		if (this.isCustomRateModeSignal()) {
			const customMultiplier = this.customConversionMultiplierSignal();

			if (!this.isValidCustomMultiplier(customMultiplier)) {
				this.transferDetailsStepFg.controls.customConversionMultiplier.markAsTouched();
				return;
			}

			this.currencyMultiplierSignal.set(customMultiplier);
			stepper.next();
			return;
		}

		const rateRequestVersion = ++this.automaticRateRequestVersion;
		this.isPreparingSignal.set(true);
		this.exchangeService
			.getExchangeMultiplier({
				originCurrency: sourceAccount.currency,
				targetCurrency: destinationAccount.currency,
				operationDate,
			})
			.pipe(
				take(1),
				finalize(() => {
					if (this.automaticRateRequestVersion === rateRequestVersion) {
						this.isPreparingSignal.set(false);
					}
				})
			)
			.subscribe({
				next: response => {
					if (
						!this.isAutomaticRateRequestCurrent(
							rateRequestVersion,
							sourceAccount,
							destinationAccount,
							operationDate
						)
					) {
						return;
					}

					if (!response.isSucceeded) {
						this.errorMessageSignal.set('Unable to prepare the transfer. Please try again.');
						return;
					}

					this.currencyMultiplierSignal.set(response.payload);
					stepper.next();
				},
				error: () => {
					if (
						this.isAutomaticRateRequestCurrent(
							rateRequestVersion,
							sourceAccount,
							destinationAccount,
							operationDate
						)
					) {
						this.errorMessageSignal.set('Unable to prepare the transfer. Please try again.');
					}
				},
			});
	}

	public previous(stepper: MatStepper): void {
		stepper.previous();
	}

	public setRateMode(mode: ExchangeRateMode): void {
		const customMultiplierControl = this.transferDetailsStepFg.controls.customConversionMultiplier;

		this.transferDetailsStepFg.controls.rateMode.setValue(mode);
		this.cancelAutomaticRateRequest();
		this.currencyMultiplierSignal.set(null);
		this.errorMessageSignal.set('');

		if (mode === 'Custom') {
			customMultiplierControl.enable();
			return;
		}

		customMultiplierControl.disable();
	}

	public resetRateForCurrencyPair(): void {
		this.transferDetailsStepFg.controls.rateMode.setValue('Automatic');
		this.transferDetailsStepFg.controls.customConversionMultiplier.reset({ value: null, disabled: true });
		this.cancelAutomaticRateRequest();
		this.currencyMultiplierSignal.set(null);
		this.errorMessageSignal.set('');
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
				finalize(() => this.isLoadingSignal.set(false))
			)
			.subscribe({
				next: response => {
					if (!response.isSucceeded) {
						this.handleTransferFailure();
						return;
					}

					this.dialogRef.close();
				},
				error: () => this.handleTransferOutcomeUnknown(),
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
		const multiplier = this.effectiveMultiplierSignal();
		const operationAt = this.operationDateSignal();

		if (!sender || !recipient || amount === null || multiplier === null || !operationAt) {
			return undefined;
		}

		return {
			sender,
			recipient,
			amount,
			multiplier,
			operationAt,
			...(this.isCustomRateModeSignal() ? { customConversionMultiplier: multiplier } : {}),
		};
	}

	private isValidCustomMultiplier(value: number | null): value is number {
		return typeof value === 'number' && Number.isFinite(value) && value > 0;
	}

	private cancelAutomaticRateRequest(): void {
		this.automaticRateRequestVersion++;
		this.isPreparingSignal.set(false);
	}

	private isAutomaticRateRequestCurrent(
		rateRequestVersion: number,
		sourceAccount: IPaymentAccountModel,
		destinationAccount: IPaymentAccountModel,
		operationDate: Date
	): boolean {
		return (
			this.automaticRateRequestVersion === rateRequestVersion &&
			!this.isCustomRateModeSignal() &&
			this.fromAccountSignal()?.currency === sourceAccount.currency &&
			this.toAccountSignal()?.currency === destinationAccount.currency &&
			this.operationDateSignal()?.getTime() === operationDate.getTime()
		);
	}

	private handleTransferFailure(): void {
		this.errorMessageSignal.set('Unable to complete the transfer. Please try again.');
	}

	private handleTransferOutcomeUnknown(): void {
		this.errorMessageSignal.set(
			'We could not confirm whether the transfer was completed. Check your account before submitting another transfer.'
		);
	}
}
