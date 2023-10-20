import { Injectable } from '@angular/core';
import { MatDialogConfig } from '@angular/material/dialog';

import { of, take } from 'rxjs';

import { DialogProvider } from '../../../app/modules/shared/providers/dialog-provider';
import { Result } from '../../../core/result';
import { DialogContainer } from '../../../app/modules/shared/models/dialog-container';
import { PaymentAccountDialogComponent } from '../../../app/modules/shared/components/dialog/payment-account/payment-account.-dialog.component';
import { PaymentAccountModel } from '../../../domain/models/accounting/payment-account';
import { DefaultPaymentAccountsProvider } from '../../../data/providers/accounting/payment-accounts.provider';

@Injectable()
export class PaymentAccountDialogService {
	constructor(
		private readonly dialogProvider: DialogProvider,
		private readonly defaultPaymentAccountsProvider: DefaultPaymentAccountsProvider
	) {}

	public openPaymentAccount(): void {
		const config = new MatDialogConfig<DialogContainer>();

		const onSave = (operationResult: Result<PaymentAccountModel>) => {
			if (!operationResult.isSucceeded) {
				return;
			}

			this.defaultPaymentAccountsProvider
				.savePaymentAccount(operationResult.payload)
				.pipe(take(1))
				.subscribe((newPaymentAccountGuid) => {
					return newPaymentAccountGuid;
				});

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
