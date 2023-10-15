import { ChangeDetectionStrategy, Component, Inject, signal } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { take } from 'rxjs';

import { DialogContainer } from '../../../models/dialog-container';
import { AccountTypes } from '../../../../../../domain/models/accounting/account-types';
import { CurrencyAbbrevitions } from '../../../constants/rates-abbreviations';

@Component({
	selector: 'payment-account',
	templateUrl: './payment-account.component.html',
	styleUrls: ['./payment-account.component.css'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentAccountDialogComponent {
	private dialogConfiguration: DialogContainer;
	public isLoadingSignal = signal<boolean>(false);
	public dialogFg: UntypedFormGroup;
	public title: string;

	public accountTypeStepFormGroup = this.fb.group({
		accountTypeCtrl: [''],
	});

	public currencyStepFormGroup = this.fb.group({
		currencyCtrl: [''],
	});

	public balanceStepFormGroup = this.fb.group({
		balanceCtrl: [0],
	});

	public additionalInfoStepFormGroup = this.fb.group({
		emitterCtrl: [''],
		descriptionCtrls: [''],
	});

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

		this.dialogConfiguration
			.onSubmit(this.dialogFg.value)
			.pipe(take(1))
			.subscribe((_) => {
				this.isLoadingSignal.set(false);
				this.dialogRef.close();
			});
	}
}
