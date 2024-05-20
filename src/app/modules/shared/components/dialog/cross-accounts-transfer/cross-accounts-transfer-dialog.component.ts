/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { ENTER } from '@angular/cdk/keycodes';
import { ChangeDetectionStrategy, Component, computed, Inject, signal, Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import _ from 'lodash';

import { Select, Store } from '@ngxs/store';
import { map, Observable, switchMap, take, tap } from 'rxjs';

import { Result } from '../../../../../../core/result';
import { PaymensHistoryProvider } from '../../../../../../data/providers/accounting/payments-history.provider';
import { CurrencyExchangeService } from '../../../../../../data/providers/rates/currency-exchange.service';
import { ICrossAccountsTransferModel } from '../../../../../../domain/models/accounting/cross-accounts-transfer.model';
import { MoneyTransferDirections } from '../../../../../../domain/models/accounting/money-transfer-directions';
import { IPaymentAccountModel } from '../../../../../../domain/models/accounting/payment-account.model';
import { ICrossAccountsTransferResponse } from '../../../../../../domain/models/accounting/responses/cross-accounts-transfer.response';
import { OperationTypes } from '../../../../../../domain/types/operation.types';
import { CurrencyAbbrevitions } from '../../../constants/rates-abbreviations';
import { DialogContainer } from '../../../models/dialog-container';
import { SelectDropdownOptions } from '../../../models/select-dropdown-options';
import { Add } from '../../../store/states/accounting/actions/payment-operation.actions';
import {
	getActivePaymentAccount,
	getActivePaymentAccountId,
	getPaymentAccounts,
} from '../../../store/states/accounting/selectors/payment-account.selector';

@Component({
	selector: 'cross-accounts-transfer-dialog',
	templateUrl: './cross-accounts-transfer-dialog.component.html',
	styleUrls: ['./cross-accounts-transfer-dialog.component.css'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CrossAccountsTransferDialogComponent {
	private dialogConfiguration: DialogContainer<ICrossAccountsTransferModel, Result<ICrossAccountsTransferResponse>>;
	public isLoadingSignal = signal<boolean>(false);

	public readonly separatorKeysCodes: number[] = [ENTER];
	public isSaveDisabled: boolean = true;
	public title: string;
	public baseTransferStepFg: UntypedFormGroup = this.fb.group({
		transferDirections: new UntypedFormControl(),
		targetAccount: new UntypedFormControl(),
		operationDate: new UntypedFormControl(new Date()),
	});

	public confirmStepFg: UntypedFormGroup;

	@Select(getPaymentAccounts)
	paymentAccounts$!: Observable<IPaymentAccountModel[]>;

	@Select(getActivePaymentAccountId)
	paymentAccountId$!: Observable<string>;

	@Select(getActivePaymentAccount)
	activePaymentAccount$!: Observable<IPaymentAccountModel>;

	public targetPaymentAccountTitlesSignal: Signal<SelectDropdownOptions[]>;
	public paymentAccountsSignal: Signal<IPaymentAccountModel[]>;
	public paymentAccountIdSignal: Signal<string>;
	public activePaymentAccountSignal: Signal<IPaymentAccountModel>;
	public targetPaymentAccountSignal: Signal<IPaymentAccountModel>;

	public targetPaymentAccountOptionSignal: Signal<SelectDropdownOptions>;

	public transferAmmountSignal: Signal<number>;

	public currencyMultiplierSignal: Signal<number>;

	public transferDirectionsOptionSignal: Signal<SelectDropdownOptions>;

	public transferSummarySignal: Signal<string[]>;

	public operationDateSignal: Signal<Date>;

	public inSenderSignal: Signal<boolean>;

	constructor(
		private readonly store: Store,
		private readonly fb: UntypedFormBuilder,
		private readonly exchangeService: CurrencyExchangeService,
		private readonly paymentHistoryService: PaymensHistoryProvider,
		private dialogRef: MatDialogRef<CrossAccountsTransferDialogComponent>,
		@Inject(MAT_DIALOG_DATA)
		dialogConfiguration: DialogContainer<ICrossAccountsTransferModel, Result<ICrossAccountsTransferResponse>>
	) {
		this.title = dialogConfiguration.title;
		this.dialogConfiguration = dialogConfiguration;
		this.paymentAccountsSignal = toSignal(this.paymentAccounts$, { initialValue: [] });
		this.paymentAccountIdSignal = toSignal(this.paymentAccountId$, { initialValue: '' });
		this.activePaymentAccountSignal = toSignal(this.activePaymentAccount$, {
			initialValue: {} as IPaymentAccountModel,
		});

		this.confirmStepFg = this.fb.group({
			currencyRate: new UntypedFormControl(),
			transefAmmount: new UntypedFormControl(),
		});

		this.inSenderSignal = computed(() => this.transferDirectionsOptionSignal().value === 'In');

		this.targetPaymentAccountTitlesSignal = computed(() =>
			_.chain(this.paymentAccountsSignal())
				.filter(acc => acc.key?.toString() !== this.paymentAccountIdSignal())
				.map(
					acc =>
						new SelectDropdownOptions({
							decription: `[${acc.currency}] ${acc.emitter} | ${acc.description}`,
							value: acc.key?.toString(),
						})
				)
				.value()
		);

		this.targetPaymentAccountSignal = computed(() =>
			_.chain(this.paymentAccountsSignal())
				.find(acc => acc.key?.toString() === this.targetPaymentAccountOptionSignal().value)
				.value()
		);

		this.transferSummarySignal = computed(() => {
			const transferDirection = this.inSenderSignal()
				? `Convertion from '${this.activePaymentAccountSignal().currency}' to '${this.targetPaymentAccountSignal().currency}'`
				: `Convertion from '${this.targetPaymentAccountSignal().currency}' to '${this.activePaymentAccountSignal().currency}'`;

			const originPaymentAccountInfo = `'${this.activePaymentAccountSignal().emitter} | ${this.activePaymentAccountSignal().description}'
				after: '${_.round(this.activePaymentAccountSignal().balance - this.transferAmmountSignal(), 3)}' ('${this.activePaymentAccountSignal().currency}')`;

			const targetCurrencyTransferAmmount = _.round(
				this.currencyMultiplierSignal() * this.transferAmmountSignal(),
				3
			);

			const targetPaymentAccountInfo = `'${this.targetPaymentAccountSignal().emitter} | ${this.targetPaymentAccountSignal().description}'
				after: '${_.round(this.targetPaymentAccountSignal().balance + targetCurrencyTransferAmmount, 3)}' ('${this.targetPaymentAccountSignal().currency}')`;

			return [
				transferDirection,
				`Transfer amount ${targetCurrencyTransferAmmount} ('${this.targetPaymentAccountSignal().currency}')`,
				`Sender ${this.inSenderSignal() ? originPaymentAccountInfo : targetPaymentAccountInfo}`,
				`Reciever ${this.inSenderSignal() ? targetPaymentAccountInfo : originPaymentAccountInfo}`,
			];
		});

		this.transferDirectionsOptionSignal = toSignal(
			this.baseTransferStepFg.get('transferDirections')!.valueChanges,
			{
				initialValue: this.getTransferDirections()[0],
			}
		);

		this.operationDateSignal = toSignal(this.baseTransferStepFg.get('operationDate')!.valueChanges, {
			initialValue: this.baseTransferStepFg.get('operationDate')!.value,
		});

		this.targetPaymentAccountOptionSignal = toSignal(this.baseTransferStepFg.get('targetAccount')!.valueChanges, {
			initialValue: this.targetPaymentAccountTitlesSignal()[0],
		});

		this.transferAmmountSignal = toSignal(this.confirmStepFg.get('transefAmmount')!.valueChanges, {
			initialValue: 0,
		});

		this.currencyMultiplierSignal = toSignal(this.confirmStepFg.get('currencyRate')!.valueChanges, {
			initialValue: 0,
		});
	}

	public getTransferDirections(): SelectDropdownOptions[] {
		return _.map(
			Object.keys(MoneyTransferDirections).filter(v => isNaN(Number(v))),
			i => new SelectDropdownOptions({ value: i, decription: i })
		);
	}

	public close() {
		this.dialogRef.close();
	}

	public updateTransferDate(operationDate: Date | null) {
		this.exchangeService
			.getExchange({
				operationDate: operationDate!,
				originCurrency: this.activePaymentAccountSignal().currency,
				targetCurrency: CurrencyAbbrevitions.USD,
				amount: 11.22,
			})
			.pipe(tap(response => console.log(response)))
			.subscribe();
	}

	public getMultiplier(): void {
		this.exchangeService
			.getExchangeMultiplier({
				originCurrency: this.inSenderSignal()
					? this.activePaymentAccountSignal().currency
					: this.targetPaymentAccountSignal().currency,
				targetCurrency: this.inSenderSignal()
					? this.targetPaymentAccountSignal().currency
					: this.activePaymentAccountSignal().currency,
				operationDate: this.operationDateSignal(),
			})
			.pipe(take(1))
			.subscribe(response => this.confirmStepFg.patchValue({ currencyRate: response.payload }));
	}

	public applyTransfer(): void {
		this.isLoadingSignal.set(true);

		this.dialogConfiguration
			.onSubmit({
				sender: this.inSenderSignal()
					? this.activePaymentAccountSignal().key
					: this.targetPaymentAccountSignal().key,
				recipient: this.inSenderSignal()
					? this.targetPaymentAccountSignal().key
					: this.activePaymentAccountSignal().key,
				amount: this.transferAmmountSignal(),
				multiplier: this.currencyMultiplierSignal(),
				operationAt: this.operationDateSignal(),
			} as ICrossAccountsTransferModel)
			.pipe(
				take(1),
				map(resposneResult => resposneResult.payload),
				switchMap(transferResponse =>
					this.paymentHistoryService.GetHistoryOperationById(
						this.activePaymentAccountSignal().key!,
						transferResponse.paymentOperationId
					)
				)
			)
			.subscribe(operationHistoryRecord => {
				this.isLoadingSignal.set(false);

				const transferOperation = operationHistoryRecord.record;
				transferOperation.operationType = 'TRANSFER';

				this.store.dispatch(new Add(transferOperation));

				this.dialogRef.close();
			});
	}
}
