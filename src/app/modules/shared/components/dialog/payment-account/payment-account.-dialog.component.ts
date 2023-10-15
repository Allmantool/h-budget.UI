import { ChangeDetectionStrategy, Component, Inject, signal } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { toSignal } from '@angular/core/rxjs-interop';

import { take } from 'rxjs';
import { Guid } from 'typescript-guid';

import { DialogContainer } from '../../../models/dialog-container';
import { AccountTypes } from '../../../../../../domain/models/accounting/account-types';
import { CurrencyAbbrevitions } from '../../../constants/rates-abbreviations';
import { PaymentAccount } from 'domain/models/accounting/payment-account';
import { Result } from 'core/result';

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

	public currencyStepFg = this.fb.group({
		currencyCtrl: [''],
	});

	public balanceStepFg = this.fb.group({
		balanceCtrl: [0],
	});

	public additionalInfoStepFormGroup = this.fb.group({
		emitterCtrl: [''],
		descriptionCtrls: [''],
	});

	public accountTypeSignal = toSignal<string>(
		this.accountTypeStepFg.get('accountTypeCtrl')!.valueChanges
	);

	public currencySignal = toSignal<string>(this.currencyStepFg.get('currencyCtrl')!.valueChanges);

	public balanceSignal = toSignal<number>(this.balanceStepFg.get('balanceCtrl')!.valueChanges);

	constructor(
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

		const paymentAccountForSave: PaymentAccount = {
			id: Guid.create(),
			type: AccountTypes[this.accountTypeSignal()! as keyof typeof AccountTypes],
			currency:
				CurrencyAbbrevitions[this.currencySignal()! as keyof typeof CurrencyAbbrevitions],
			balance: this.balanceSignal()!,
			emitter: 'some emitter',
			description: 'some description',
		};

		this.dialogConfiguration
			.onSubmit(
				new Result<PaymentAccount>({ payload: paymentAccountForSave, isSucceeded: true })
			)
			.pipe(take(1))
			.subscribe((_) => {
				this.isLoadingSignal.set(false);
				this.dialogRef.close();
			});
	}
}
