/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { ENTER } from '@angular/cdk/keycodes';
import {
	AfterViewInit,
	ChangeDetectionStrategy,
	Component,
	computed,
	Inject,
	OnInit,
	signal,
	Signal,
} from '@angular/core';
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

	public targetAccountSignal: Signal<SelectDropdownOptions>;

	public transferDirectionsSignal: Signal<string>;

	public operationDateSignal: Signal<Date>;

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

		this.targetPaymentAccountTitlesSignal = computed(() =>
			_.chain(this.paymentAccountsSignal())
				.filter(acc => acc.key?.toString() !== this.paymentAccountIdSignal())
				.map(
					acc =>
						new SelectDropdownOptions({
							decription: `${acc.emitter} | ${acc.description}`,
							value: acc.currency,
						})
				)
				.value()
		);

		this.transferDirectionsSignal = toSignal(this.baseTransferStepFg.get('transferDirections')!.valueChanges, {
			initialValue: this.getTransferDirections()[0],
		});

		this.operationDateSignal = toSignal(this.baseTransferStepFg.get('operationDate')!.valueChanges, {
			initialValue: this.baseTransferStepFg.get('operationDate')!.value,
		});

		this.targetAccountSignal = toSignal(this.baseTransferStepFg.get('targetAccount')!.valueChanges, {
			initialValue: this.targetPaymentAccountTitlesSignal()[0],
		});
	}

	public getTransferDirections(): string[] {
		return Object.keys(MoneyTransferDirections).filter(v => isNaN(Number(v)));
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
				originCurrency: this.activePaymentAccountSignal().currency,
				targetCurrency: this.targetAccountSignal().value,
				operationDate: this.operationDateSignal(),
			})
			.pipe(take(1))
			.subscribe(multiplier => console.log(multiplier));
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
