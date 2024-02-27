import { Injectable } from '@angular/core';
import { MatDialogConfig } from '@angular/material/dialog';

import * as _ from 'lodash';

import { concatMap, filter, map, of, tap } from 'rxjs';

import { PaymentAccountDialogComponent } from '../../../app/modules/shared/components/dialog/payment-account/payment-account-dialog.component';
import { DialogContainer } from '../../../app/modules/shared/models/dialog-container';
import { DialogOperationTypes } from '../../../app/modules/shared/models/dialog-operation-types';
import { DialogProvider } from '../../../app/modules/shared/providers/dialog-provider';
import { Result } from '../../../core/result';
import { DefaultPaymentAccountsProvider } from '../../../data/providers/accounting/payment-accounts.provider';
import { IPaymentAccountModel } from '../../../domain/models/accounting/payment-account.model';

@Injectable()
export class PaymentAccountDialogService {
	constructor(
		private readonly dialogProvider: DialogProvider,
		private readonly paymentAccountsProvider: DefaultPaymentAccountsProvider
	) {}

	public openForSave(): void {
		const config = new MatDialogConfig<
			DialogContainer<Result<IPaymentAccountModel>, Result<IPaymentAccountModel>>
		>();

		const onSave = (operationResult: Result<IPaymentAccountModel>) => {
			if (!operationResult.isSucceeded) {
				return of({
					isSucceeded: false,
				} as Result<IPaymentAccountModel>);
			}

			return this.paymentAccountsProvider.savePaymentAccount(operationResult.payload).pipe(
				filter(responseResult => responseResult.isSucceeded),
				map(responseResult => responseResult.payload),
				tap(newPaymentAccountGuid => console.log(newPaymentAccountGuid)),
				concatMap(newPaymentAccountGuid => {
					return this.paymentAccountsProvider.getById(newPaymentAccountGuid).pipe(
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
		};

		config.disableClose = true;

		this.dialogProvider.openDialog(PaymentAccountDialogComponent, config);
	}

	public openForUpdate(paymentAccountid: string): void {
		const config = new MatDialogConfig<
			DialogContainer<Result<IPaymentAccountModel>, Result<IPaymentAccountModel>>
		>();

		const onUpdate = (operationResult: Result<IPaymentAccountModel>) => {
			if (!operationResult.isSucceeded) {
				return;
			}

			if (_.isEmpty(paymentAccountid)) {
				return;
			}

			return this.paymentAccountsProvider.updatePaymentAccount(operationResult.payload, paymentAccountid).pipe(
				filter(responseResult => responseResult.isSucceeded),
				map(responseResult => responseResult.payload),
				concatMap(updatedPaymentAccountGuid => {
					return this.paymentAccountsProvider.getById(updatedPaymentAccountGuid).pipe(
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
		} as DialogContainer<Result<IPaymentAccountModel>, Result<IPaymentAccountModel>>;

		config.disableClose = true;

		this.dialogProvider.openDialog(PaymentAccountDialogComponent, config);
	}
}
