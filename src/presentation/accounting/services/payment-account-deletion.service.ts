import { HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { MatDialogConfig } from '@angular/material/dialog';

import { catchError, map, Observable, throwError } from 'rxjs';

import { DialogProvider } from '../../../app/modules/shared/providers/dialog-provider';
import { DefaultPaymentAccountsProvider } from '../../../data/providers/accounting/payment-accounts.provider';
import { IPaymentAccountModel } from '../../../domain/models/accounting/payment-account.model';
import { PaymentAccountDeleteDialogComponent } from '../components/payment-account-delete-dialog/payment-account-delete-dialog.component';
import { PaymentAccountDeleteDialogData } from '../models/payment-account-delete-dialog-data';

@Injectable()
export class PaymentAccountDeletionService {
	private readonly dialogProvider = inject(DialogProvider);
	private readonly paymentAccountsProvider = inject(DefaultPaymentAccountsProvider);

	public open(account: IPaymentAccountModel): Observable<IPaymentAccountModel | undefined> {
		const accountId = account.key?.toString();
		const config = new MatDialogConfig<PaymentAccountDeleteDialogData>();

		config.autoFocus = 'first-tabbable';
		config.data = {
			account,
			deleteAccount: () => this.deleteAccount(accountId),
		};
		config.disableClose = false;
		config.maxWidth = 'calc(100vw - 2rem)';
		config.restoreFocus = true;
		config.width = '30rem';

		return this.dialogProvider
			.openDialog<
				PaymentAccountDeleteDialogComponent,
				PaymentAccountDeleteDialogData,
				IPaymentAccountModel
			>(PaymentAccountDeleteDialogComponent, config)
			.afterClosed();
	}

	private deleteAccount(accountId: string | undefined): Observable<void> {
		if (!accountId) {
			return throwError(() => new Error('This account is no longer available. Refresh the page and try again.'));
		}

		return this.paymentAccountsProvider.removePaymentAccount(accountId).pipe(
			map(result => {
				if (!result.isSucceeded) {
					throw new Error(result.message || 'This account could not be deleted. Try again.');
				}
			}),
			catchError((error: unknown) => throwError(() => new Error(this.userMessage(error))))
		);
	}

	private userMessage(error: unknown): string {
		if (!(error instanceof HttpErrorResponse)) {
			return error instanceof Error && error.message
				? error.message
				: 'This account could not be deleted. Try again.';
		}

		if (error.status === 0) {
			return 'Unable to reach Home Ledger. Check your connection and try again.';
		}

		const apiMessage = this.apiMessage(error);
		if ([400, 404, 409, 422].includes(error.status) && apiMessage) {
			return apiMessage;
		}

		return 'This account could not be deleted. Try again.';
	}

	private apiMessage(error: HttpErrorResponse): string | undefined {
		if (typeof error.error !== 'object' || error.error === null) {
			return undefined;
		}

		const response = error.error as Record<string, unknown>;
		const message = response['statusMessage'] ?? response['message'];

		return typeof message === 'string' && message.trim() ? message : undefined;
	}
}
