import { Injectable } from '@angular/core';
import { MatDialogConfig } from '@angular/material/dialog';

import * as _ from 'lodash';

import { concatMap, filter, map, tap } from 'rxjs';

import { PaymentAccountDialogComponent } from '../../../app/modules/shared/components/dialog/payment-account/payment-account-dialog.component';
import { DialogContainer } from '../../../app/modules/shared/models/dialog-container';
import { DialogOperationTypes } from '../../../app/modules/shared/models/dialog-operation-types';
import { DialogProvider } from '../../../app/modules/shared/providers/dialog-provider';
import { Result } from '../../../core/result';
import { DefaultPaymentAccountsProvider } from '../../../data/providers/accounting/payment-accounts.provider';
import { PaymentAccountModel } from '../../../domain/models/accounting/payment-account.model';

@Injectable()
export class PaymentAccountDialogService {
	constructor(
		private readonly dialogProvider: DialogProvider,
		private readonly defaultPaymentAccountsProvider: DefaultPaymentAccountsProvider
	) {}

	public openPaymentAccountForSave(): void {
		const config = new MatDialogConfig<DialogContainer>();

		const onSave = (operationResult: Result<PaymentAccountModel>) => {
			if (!operationResult.isSucceeded) {
				return;
			}

			return this.defaultPaymentAccountsProvider.savePaymentAccount(operationResult.payload).pipe(
				filter(responseResult => responseResult.isSucceeded),
				map(responseResult => responseResult.payload),
				tap(newPaymentAccountGuid => console.log(newPaymentAccountGuid)),
				concatMap(newPaymentAccountGuid => {
					return this.defaultPaymentAccountsProvider.getPaymentAccountById(newPaymentAccountGuid).pipe(
						map(
							response =>
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
			title: 'Payment account: (Add new)',
			onSubmit: onSave,
		} as DialogContainer;

		config.disableClose = true;

		this.dialogProvider.openDialog(PaymentAccountDialogComponent, config);
	}

	public openPaymentAccountForUpdate(paymentAccountid: string): void {
		const config = new MatDialogConfig<DialogContainer>();

		const onUpdate = (operationResult: Result<PaymentAccountModel>) => {
			if (!operationResult.isSucceeded) {
				return;
			}

			if (_.isEmpty(paymentAccountid)) {
				return;
			}

			return this.defaultPaymentAccountsProvider
				.updatePaymentAccount(operationResult.payload, paymentAccountid)
				.pipe(
					filter(responseResult => responseResult.isSucceeded),
					map(responseResult => responseResult.payload),
					concatMap(updatedPaymentAccountGuid => {
						return this.defaultPaymentAccountsProvider
							.getPaymentAccountById(updatedPaymentAccountGuid)
							.pipe(
								map(
									response =>
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
			title: 'Payment account: (Update)',
			operationType: DialogOperationTypes.Update,
			onSubmit: onUpdate,
		} as DialogContainer;

		config.disableClose = true;

		this.dialogProvider.openDialog(PaymentAccountDialogComponent, config);
	}
}
