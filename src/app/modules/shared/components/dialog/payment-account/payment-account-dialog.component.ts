import { ChangeDetectionStrategy, Component, computed, Inject, signal, Signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import * as _ from 'lodash';

import { Select, Store } from '@ngxs/store';
import { filter, Observable, take } from 'rxjs';

import { Result } from 'core/result';

import { AccountTypes } from '../../../../../../domain/models/accounting/account-types';
import { IPaymentAccountModel } from '../../../../../../domain/models/accounting/payment-account.model';
import { CurrencyAbbreviations } from '../../../constants/rates-abbreviations';
import { DialogContainer } from '../../../models/dialog-container';
import { DialogOperationTypes } from '../../../models/dialog-operation-types';
import { SelectDropdownOptions } from '../../../models/select-dropdown-options';
import {
	AddPaymentAccount,
	UpdatePaymentAccount,
} from '../../../store/states/accounting/actions/payment-account.actions';
import {
	getActivePaymentAccountId,
	getPaymentAccounts,
} from '../../../store/states/accounting/selectors/payment-account.selector';

@Component({
	selector: 'payment-account-dialog',
	templateUrl: './payment-account-dialog.component.html',
	styleUrls: ['./payment-account-dialog.component.css'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentAccountDialogComponent {
	private dialogConfiguration: DialogContainer<Result<IPaymentAccountModel>, Result<IPaymentAccountModel>>;
	public isLoadingSignal = signal<boolean>(false);
	public additionalInfoSignal: Signal<string> = computed(() => {
		if (_.isEmpty(this.emitterSignal()) && _.isEmpty(this.descriptionSignal())) {
			return `N/A`;
		}

		if (_.isEmpty(this.descriptionSignal()) || _.isEmpty(this.emitterSignal())) {
			return _.trim(`${this.emitterSignal()} ${this.descriptionSignal()}`);
		}

		return `${this.emitterSignal()} | ${this.descriptionSignal()}`;
	});

	public title: string;

	public accountTypeStepFg: UntypedFormGroup;

	public currencyStepFg: UntypedFormGroup;

	public additionalInfoStepFg = this.fb.group({
		descriptionCtrl: [''],
		emitterCtrl: [''],
	});

	public balanceStepFg = this.fb.group({
		balanceCtrl: [0],
	});

	public accountTypeSignal: Signal<SelectDropdownOptions>;

	public currencySignal: Signal<SelectDropdownOptions>;

	public balanceSignal = toSignal(this.balanceStepFg.get('balanceCtrl')!.valueChanges, {
		initialValue: 0,
	});

	public emitterSignal = toSignal(this.additionalInfoStepFg.get('emitterCtrl')!.valueChanges, {
		initialValue: '',
	});

	public descriptionSignal = toSignal(this.additionalInfoStepFg.get('descriptionCtrl')!.valueChanges, {
		initialValue: '',
	});

	@Select(getPaymentAccounts)
	paymentAccounts$!: Observable<IPaymentAccountModel[]>;

	@Select(getActivePaymentAccountId)
	paymentAccountId$!: Observable<string>;

	constructor(
		private readonly store: Store,
		private readonly dialogRef: MatDialogRef<PaymentAccountDialogComponent>,
		private readonly fb: UntypedFormBuilder,
		@Inject(MAT_DIALOG_DATA)
		dialogConfiguration: DialogContainer<Result<IPaymentAccountModel>, Result<IPaymentAccountModel>>
	) {
		this.title = dialogConfiguration.title;
		this.dialogConfiguration = dialogConfiguration;

		this.accountTypeStepFg = this.fb.group({
			accountTypeCtrl: [this.getAccountsTypes()[0].value],
		});

		this.accountTypeSignal = toSignal(this.accountTypeStepFg.get('accountTypeCtrl')!.valueChanges, {
			initialValue: this.getAccountsTypes()[0],
		});

		this.currencyStepFg = this.fb.group({
			currencyCtrl: [this.getCurrencyTypes()[0].value],
		});

		this.currencySignal = toSignal(this.currencyStepFg.get('currencyCtrl')!.valueChanges, {
			initialValue: this.getCurrencyTypes()[0],
		});

		this.paymentAccountId$
			.pipe(
				takeUntilDestroyed(),
				filter(() => this.dialogConfiguration.operationType === DialogOperationTypes.Update)
			)
			.subscribe(accountId => {
				const accountsSignal = toSignal(this.paymentAccounts$, { initialValue: [] });

				const paymentAccountForUpdate = _.find(accountsSignal(), function (i) {
					return _.isEqual(i.key?.toString(), accountId);
				});

				this.accountTypeStepFg
					.get('accountTypeCtrl')
					?.setValue(this.getAccountsTypes()[Number(paymentAccountForUpdate?.type)], { onlySelf: true });

				this.currencyStepFg
					.get('currencyCtrl')
					?.setValue(paymentAccountForUpdate?.currency, { onlySelf: true });

				this.balanceStepFg.get('balanceCtrl')?.setValue(paymentAccountForUpdate?.balance);
				this.additionalInfoStepFg.get('emitterCtrl')?.setValue(paymentAccountForUpdate?.emitter);
				this.additionalInfoStepFg.get('descriptionCtrl')?.setValue(paymentAccountForUpdate?.description);
			});
	}

	public close() {
		this.dialogRef.close();
	}

	public getAccountsTypes(): SelectDropdownOptions[] {
		return _.map(
			Object.keys(AccountTypes).filter(v => isNaN(Number(v))),
			type =>
				new SelectDropdownOptions({
					description: type,
					value: type,
				})
		);
	}

	public getCurrencyTypes(): SelectDropdownOptions[] {
		return _.map(
			Object.keys(CurrencyAbbreviations).filter(v => isNaN(Number(v))),
			abbreviation =>
				new SelectDropdownOptions({
					description: abbreviation,
					value: abbreviation,
				})
		);
	}

	public applyChanges(): void {
		this.isLoadingSignal.set(true);

		const paymentAccountForSave: IPaymentAccountModel = {
			type: AccountTypes[this.accountTypeSignal().value! as keyof typeof AccountTypes],
			currency: this.currencySignal().value!,
			balance: this.balanceSignal()! as number,
			emitter: this.emitterSignal()! as string,
			description: this.descriptionSignal()! as string,
		};

		this.dialogConfiguration
			.onSubmit(
				new Result<IPaymentAccountModel>({
					payload: paymentAccountForSave,
					isSucceeded: true,
				})
			)
			.pipe(take(1))
			.subscribe(response => {
				switch (this.dialogConfiguration.operationType) {
					case DialogOperationTypes.Update: {
						this.store.dispatch(new UpdatePaymentAccount(response.payload));
						break;
					}

					default: {
						this.store.dispatch(new AddPaymentAccount(response.payload));
						break;
					}
				}

				this.isLoadingSignal.set(false);
				this.dialogRef.close();
			});
	}
}
