import { Injectable } from '@angular/core';
import { MatDialogConfig } from '@angular/material/dialog';

import { of } from 'rxjs';

import { DialogProvider } from '../../../app/modules/shared/providers/dialog-provider';
import { Result } from '../../../core/result';
import { DialogContainer } from '../../../app/modules/shared/models/dialog-container';
import { PaymentAccountDialogComponent } from '../../../app/modules/shared/components/dialog/payment-account/payment-account.component';
import { PaymentAccount } from '../../../domain/models/accounting/payment-account';

@Injectable()
export class PaymentAccountDialogService {
	constructor(private dialogProvider: DialogProvider) {}

	public openPaymentAccount(): void {
		const config = new MatDialogConfig<DialogContainer>();

		const onSave = (operationResult: Result<PaymentAccount>) => {
			if (!operationResult.isSucceeded) {
				return;
			}

			return of(operationResult.payload);
		};

		config.data = {
			title: 'Payment account:',
			onSubmit: onSave,
		} as DialogContainer;

		config.disableClose = true;

		this.dialogProvider.openDialog(PaymentAccountDialogComponent, config);
	}
}
