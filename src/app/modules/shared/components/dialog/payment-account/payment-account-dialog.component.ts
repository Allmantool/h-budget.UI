import { ChangeDetectionStrategy, Component, computed, Inject, signal, Signal } from '@angular/core';
import { UntypedFormBuilder } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';

import { Select, Store } from '@ngxs/store';
import { Observable, filter, take } from 'rxjs';
import * as _ from 'lodash';

import { Result } from 'core/result';
import { DialogContainer } from '../../../models/dialog-container';
import { AccountTypes } from '../../../../../../domain/models/accounting/account-types';
import { CurrencyAbbrevitions } from '../../../constants/rates-abbreviations';
import {
	AddPaymentAccount,
	UpdatePaymentAccount,
} from '../../../store/states/accounting/actions/payment-acount.actions';
import { PaymentAccountModel } from '../../../../../../domain/models/accounting/payment-account.model';
import { DialogOperationTypes } from '../../../models/dialog-operation-types';
import {
	getPaymentAccounts,
	getActivePaymentAccountId,
} from '../../../store/states/accounting/selectors/payment-account.selector';

@Component({
	selector: 'payment-account-dialog',
	templateUrl: './payment-account-dialog.component.html',
	styleUrls: ['./payment-account-dialog.component.css'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentAccountDialogComponent {
	private dialogConfiguration: DialogContainer;
	public isLoadingSignal = signal<boolean>(false);
	public additionalInfoSignal: Signal<string> = computed(() => {
		if (_.isEmpty(this.emmiterSignal()) && _.isEmpty(this.descriptionSignal())) {
			return `N/A`;
		}

		if (_.isEmpty(this.descriptionSignal()) || _.isEmpty(this.emmiterSignal())) {
			return _.trim(`${this.emmiterSignal()} ${this.descriptionSignal()}`);
		}

		return `${this.emmiterSignal()} | ${this.descriptionSignal()}`;
	});

	public title: string;

	public accountTypeStepFg = this.fb.group({
		accountTypeCtrl: [''],
	});

	public additionalInfoStepFg = this.fb.group({
		descriptionCtrl: [''],
		emitterCtrl: [''],
	});

	public currencyStepFg = this.fb.group({
		currencyCtrl: [''],
	});

	public balanceStepFg = this.fb.group({
		balanceCtrl: [0],
	});

	public accountTypeSignal = toSignal(this.accountTypeStepFg.get('accountTypeCtrl')!.valueChanges, {
		initialValue: this.getAccountsTypes()[0],
	});

	public currencySignal = toSignal(this.currencyStepFg.get('currencyCtrl')!.valueChanges, {
		initialValue: this.getCurrencyTypes()[0]!,
	});

	public balanceSignal = toSignal(this.balanceStepFg.get('balanceCtrl')!.valueChanges, {
		initialValue: 0,
	});

	public emmiterSignal = toSignal(this.additionalInfoStepFg.get('emitterCtrl')!.valueChanges, {
		initialValue: '',
	});

	public descriptionSignal = toSignal(this.additionalInfoStepFg.get('descriptionCtrl')!.valueChanges, {
		initialValue: '',
	});

	@Select(getPaymentAccounts)
	paymentAccounts$!: Observable<PaymentAccountModel[]>;

	@Select(getActivePaymentAccountId)
	paymentAccountId$!: Observable<string>;

	constructor(
		private readonly store: Store,
		private readonly dialogRef: MatDialogRef<PaymentAccountDialogComponent>,
		private readonly fb: UntypedFormBuilder,
		@Inject(MAT_DIALOG_DATA) dialogConfiguration: DialogContainer
	) {
		this.title = dialogConfiguration.title;
		this.dialogConfiguration = dialogConfiguration;

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

	public getAccountsTypes(): string[] {
		return Object.keys(AccountTypes).filter(v => isNaN(Number(v)));
	}

	public getCurrencyTypes(): string[] {
		return Object.keys(CurrencyAbbrevitions).filter(v => isNaN(Number(v)));
	}

	public applyChanges(): void {
		this.isLoadingSignal.set(true);

		const paymentAccountForSave: PaymentAccountModel = {
			type: AccountTypes[this.accountTypeSignal()! as keyof typeof AccountTypes],
			currency: this.currencySignal()! as string,
			balance: this.balanceSignal()! as number,
			emitter: this.emmiterSignal()! as string,
			description: this.descriptionSignal()! as string,
		};

		this.dialogConfiguration
			.onSubmit(
				new Result<PaymentAccountModel>({
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
