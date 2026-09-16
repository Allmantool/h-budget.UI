/* eslint-disable @typescript-eslint/unbound-method */
import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';

import { Observable, of, Subject } from 'rxjs';
import { Guid } from 'typescript-guid';

import { DialogProvider } from '../../../app/modules/shared/providers/dialog-provider';
import { Result } from '../../../core/result';
import { DefaultPaymentAccountsProvider } from '../../../data/providers/accounting/payment-accounts.provider';
import { AccountTypes } from '../../../domain/models/accounting/account-types';
import { IPaymentAccountModel } from '../../../domain/models/accounting/payment-account.model';
import { PaymentAccountDeleteDialogComponent } from '../../../presentation/accounting/components/payment-account-delete-dialog/payment-account-delete-dialog.component';
import { PaymentAccountDeleteDialogData } from '../../../presentation/accounting/models/payment-account-delete-dialog-data';
import { PaymentAccountDeletionService } from '../../../presentation/accounting/services/payment-account-deletion.service';

describe('payment account deletion service', () => {
	const accountId = '0879167a-a6e8-4518-9850-4dd87a4e5be6';
	const account: IPaymentAccountModel = {
		key: Guid.parse(accountId),
		type: AccountTypes.Virtual,
		currency: 'BYN',
		balance: 200.12,
		emitter: 'Bank card',
		description: 'Everyday account',
	};

	let service: PaymentAccountDeletionService;
	let providerSpy: jasmine.SpyObj<DefaultPaymentAccountsProvider>;
	let dialogProviderSpy: jasmine.SpyObj<DialogProvider>;
	let closed: Subject<IPaymentAccountModel | undefined>;

	beforeEach(() => {
		closed = new Subject<IPaymentAccountModel | undefined>();
		const dialogRef = {
			afterClosed: () => closed.asObservable(),
		} as MatDialogRef<PaymentAccountDeleteDialogComponent, IPaymentAccountModel>;
		providerSpy = jasmine.createSpyObj<DefaultPaymentAccountsProvider>('paymentAccountsProvider', {
			removePaymentAccount: of(new Result<string>({ isSucceeded: true, payload: accountId })),
		});
		dialogProviderSpy = jasmine.createSpyObj<DialogProvider>('dialogProvider', {
			openDialog: dialogRef,
		});

		TestBed.configureTestingModule({
			providers: [
				PaymentAccountDeletionService,
				{ provide: DefaultPaymentAccountsProvider, useValue: providerSpy },
				{ provide: DialogProvider, useValue: dialogProviderSpy },
			],
		});

		service = TestBed.inject(PaymentAccountDeletionService);
	});

	it('should open a dismissible, responsive dialog and return its confirmed account', () => {
		let result: IPaymentAccountModel | undefined;
		service.open(account).subscribe(value => (result = value));
		const config = dialogProviderSpy.openDialog.calls.mostRecent().args[1] as
			| { data?: PaymentAccountDeleteDialogData }
			| undefined;

		expect(dialogProviderSpy.openDialog).toHaveBeenCalledWith(
			PaymentAccountDeleteDialogComponent,
			jasmine.objectContaining({
				disableClose: false,
				autoFocus: 'first-tabbable',
				maxWidth: 'calc(100vw - 2rem)',
			})
		);
		expect(config?.data?.account).toBe(account);

		closed.next(account);
		expect(result).toBe(account);
	});

	it('should send exactly the selected account ID and accept the backend Result<Guid> shape', done => {
		service.open(account);
		const data = dialogProviderSpy.openDialog.calls.mostRecent().args[1]?.data as PaymentAccountDeleteDialogData;

		data.deleteAccount().subscribe({
			complete: () => {
				expect(providerSpy.removePaymentAccount).toHaveBeenCalledOnceWith(accountId);
				done();
			},
		});
	});

	it('should expose safe actionable API conflict details to the dialog', done => {
		providerSpy.removePaymentAccount.and.returnValue(
			new Observable<Result<string>>(subscriber => {
				subscriber.error(
					new HttpErrorResponse({
						status: 409,
						error: { statusMessage: 'The account is referenced by a protected ledger rule.' },
					})
				);
			})
		);
		service.open(account);
		const data = dialogProviderSpy.openDialog.calls.mostRecent().args[1]?.data as PaymentAccountDeleteDialogData;

		data.deleteAccount().subscribe({
			error: (error: unknown) => {
				expect(error).toEqual(jasmine.any(Error));
				expect((error as Error).message).toBe('The account is referenced by a protected ledger rule.');
				done();
			},
		});
	});

	it('should convert network failures into retryable user guidance', done => {
		providerSpy.removePaymentAccount.and.returnValue(
			new Observable<Result<string>>(subscriber => subscriber.error(new HttpErrorResponse({ status: 0 })))
		);
		service.open(account);
		const data = dialogProviderSpy.openDialog.calls.mostRecent().args[1]?.data as PaymentAccountDeleteDialogData;

		data.deleteAccount().subscribe({
			error: (error: unknown) => {
				expect((error as Error).message).toBe(
					'Unable to reach Home Ledger. Check your connection and try again.'
				);
				done();
			},
		});
	});
});
