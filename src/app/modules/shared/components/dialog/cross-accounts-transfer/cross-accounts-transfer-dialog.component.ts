/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { ENTER } from '@angular/cdk/keycodes';
import { ChangeDetectionStrategy, Component, computed, Inject, signal, Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import _ from 'lodash';

import { Select } from '@ngxs/store';
import { Observable, take, tap } from 'rxjs';

import { Result } from '../../../../../../core/result';
import { CurrencyExchangeService } from '../../../../../../data/providers/rates/currency-exchange.service';
import { MoneyTransferDirections } from '../../../../../../domain/models/accounting/money-transfer-directions';
import { IPaymentAccountModel } from '../../../../../../domain/models/accounting/payment-account.model';
import { CurrencyAbbrevitions } from '../../../constants/rates-abbreviations';
import { DialogContainer } from '../../../models/dialog-container';
import { SelectDropdownOptions } from '../../../models/select-dropdown-options';
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
	private dialogConfiguration: DialogContainer<IPaymentAccountModel[], Result<IPaymentAccountModel[]>>;
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

	public currencyRateSignal: Signal<number>;

	public transferDirectionsOptionSignal: Signal<SelectDropdownOptions>;

	public transferSummarySignal: Signal<string[]>;

	public operationDateSignal: Signal<Date>;

	public inSenderSignal: Signal<boolean>;

	constructor(
		private fb: UntypedFormBuilder,
		private exchangeService: CurrencyExchangeService,
		private dialogRef: MatDialogRef<CrossAccountsTransferDialogComponent>,
		@Inject(MAT_DIALOG_DATA)
		dialogConfiguration: DialogContainer<IPaymentAccountModel[], Result<IPaymentAccountModel[]>>
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
							decription: `${acc.emitter} | ${acc.description}`,
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

			const originPaymentAccountInfo = `'${this.activePaymentAccountSignal().description}' after: '${_.round(this.activePaymentAccountSignal().balance - this.transferAmmountSignal(), 3)}' ('${this.activePaymentAccountSignal().currency}')`;
			const targetPaymentAccountInfo = `'${this.targetPaymentAccountSignal().description}' after: '${_.round(this.targetPaymentAccountSignal().balance + this.currencyRateSignal() * this.transferAmmountSignal(), 3)}' ('${this.targetPaymentAccountSignal().currency}')`;

			return [
				transferDirection,
				``,
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

		this.currencyRateSignal = toSignal(this.confirmStepFg.get('currencyRate')!.valueChanges, {
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

	public save(): void {
		this.isLoadingSignal.set(true);

		this.dialogConfiguration
			.onSubmit({} as IPaymentAccountModel[])
			.pipe(take(1))
			.subscribe(() => {
				this.isLoadingSignal.set(false);
				this.dialogRef.close();
			});
	}
}
