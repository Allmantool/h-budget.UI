import { ChangeDetectionStrategy, Component, Inject, signal } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { toSignal } from '@angular/core/rxjs-interop';
import { Store } from '@ngxs/store';
import { take } from 'rxjs';

import { DialogContainer } from '../../../models/dialog-container';
import { AccountTypes } from '../../../../../../domain/models/accounting/account-types';
import { CurrencyAbbrevitions } from '../../../constants/rates-abbreviations';
import { PaymentAccountModel } from 'domain/models/accounting/payment-account';
import { Result } from 'core/result';
import { AddPaymentAccount } from '../../../store/states/accounting/actions/payment-acount.actions';

@Component({
	selector: 'payment-account-dialog',
	templateUrl: './payment-account-dialog.component.html',
	styleUrls: ['./payment-account-dialog.component.css'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentAccountDialogComponent {
	private dialogConfiguration: DialogContainer;
	public isLoadingSignal = signal<boolean>(false);
	public dialogFg: UntypedFormGroup;
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

	public accountTypeSignal = toSignal(
		this.accountTypeStepFg.get('accountTypeCtrl')!.valueChanges,
		{
			initialValue: this.getAccountsTypes()[0],
		}
	);

	public currencySignal = toSignal(this.currencyStepFg.get('currencyCtrl')!.valueChanges, {
		initialValue: this.getCurrencyTypes()[0]!,
	});

	public balanceSignal = toSignal(this.balanceStepFg.get('balanceCtrl')!.valueChanges, {
		initialValue: 0,
	});

	public emmiterSignal = toSignal(this.additionalInfoStepFg.get('emitterCtrl')!.valueChanges, {
		initialValue: '',
	});

	public descriptionSignal = toSignal(
		this.additionalInfoStepFg.get('descriptionCtrl')!.valueChanges,
		{
			initialValue: '',
		}
	);

	constructor(
		private readonly store: Store,
		private readonly dialogRef: MatDialogRef<PaymentAccountDialogComponent>,
		private readonly fb: UntypedFormBuilder,
		@Inject(MAT_DIALOG_DATA) dialogConfiguration: DialogContainer
	) {
		this.dialogFg = fb.group({
			startDate: new UntypedFormControl(new Date()),
		});

		this.title = dialogConfiguration.title;
		this.dialogConfiguration = dialogConfiguration;
	}

	public close() {
		this.dialogRef.close();
	}

	public getAccountsTypes(): string[] {
		return Object.keys(AccountTypes).filter((v) => isNaN(Number(v)));
	}

	public getCurrencyTypes(): string[] {
		return Object.keys(CurrencyAbbrevitions).filter((v) => isNaN(Number(v)));
	}

	public saveAccount(): void {
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
			.subscribe((response) => {
				this.store.dispatch(new AddPaymentAccount(response.payload));
				this.isLoadingSignal.set(false);
				this.dialogRef.close();
			});
	}
}
