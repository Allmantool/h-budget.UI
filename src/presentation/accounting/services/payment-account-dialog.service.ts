import { Injectable } from '@angular/core';
import { MatDialogConfig } from '@angular/material/dialog';

import { switchMap, take, tap, filter, map, concatMap, of, mergeMap } from 'rxjs';

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

			return this.defaultPaymentAccountsProvider
				.savePaymentAccount(operationResult.payload)
				.pipe(
					filter((responseResult) => responseResult.isSucceeded),
					map((responseResult) => responseResult.payload),
					tap((newPaymentAccountGuid) => console.log(newPaymentAccountGuid)),
					concatMap((newPaymentAccountGuid) => {
						return this.defaultPaymentAccountsProvider
							.getPaymentAccountById(newPaymentAccountGuid)
							.pipe(
								map(
									(response) =>
										new Result({
											payload: response,
											isSucceeded: true,
										})
								)
							);
					})
				);
		};

		config.data = {
			title: 'Payment account:',
			onSubmit: onSave,
		} as DialogContainer;

		config.disableClose = true;

		this.dialogProvider.openDialog(PaymentAccountDialogComponent, config);
	}
}
