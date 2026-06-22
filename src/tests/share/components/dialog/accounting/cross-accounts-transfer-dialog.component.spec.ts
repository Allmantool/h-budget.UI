/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { NgxsModule, Store } from '@ngxs/store';
import { Observable, of } from 'rxjs';
import { Guid } from 'typescript-guid';

import { CrossAccountsTransferDialogComponent } from '../../../../../app/modules/shared/components/dialog/cross-accounts-transfer/cross-accounts-transfer-dialog.component';
import { DialogContainer } from '../../../../../app/modules/shared/models/dialog-container';
import { ngxsConfig } from '../../../../../app/modules/shared/store/ngxs.config';
import { AccountingOperationsTableState } from '../../../../../app/modules/shared/store/states/accounting/accounting-operations-table.state';
import {
	SetActivePaymentAccount,
	SetInitialPaymentAccounts,
} from '../../../../../app/modules/shared/store/states/accounting/actions/payment-account.actions';
import { PaymentAccountState } from '../../../../../app/modules/shared/store/states/accounting/payment-account.state';
import { AccountingOperationsState } from '../../../../../app/modules/shared/store/states/accounting/payment-operations.state';
import { Result } from '../../../../../core/result';
import { PaymentsHistoryProvider } from '../../../../../data/providers/accounting/payments-history.provider';
import { CurrencyExchangeService } from '../../../../../data/providers/rates/currency-exchange.service';
import { AccountTypes } from '../../../../../domain/models/accounting/account-types';
import { ICrossAccountsTransferModel } from '../../../../../domain/models/accounting/cross-accounts-transfer.model';
import { IPaymentAccountModel } from '../../../../../domain/models/accounting/payment-account.model';
import { ICrossAccountsTransferResponse } from '../../../../../domain/models/accounting/responses/cross-accounts-transfer.response';
import { OperationTypes } from '../../../../../domain/types/operation.types';

describe('cross-accounts-transfer-dialog.component', () => {
	const sourceAccountId = Guid.parse('ad8ec3b4-4fa8-4112-80a8-dac1279c4a85');
	const targetAccountId = Guid.parse('c596f11b-d44d-425f-8c90-0655c51318ad');
	const transferOperationId = Guid.parse('24a07833-5cf5-4885-b09d-32c089fac4dd');
	const operationDate = new Date(2024, 0, 11);

	const paymentAccounts: IPaymentAccountModel[] = [
		{
			key: sourceAccountId,
			type: AccountTypes.Virtual,
			currency: 'BYN',
			balance: 100,
			emitter: 'Source bank',
			description: 'Source account',
		},
		{
			key: targetAccountId,
			type: AccountTypes.Virtual,
			currency: 'USD',
			balance: 25,
			emitter: 'Target bank',
			description: 'Target account',
		},
	];

	let component: CrossAccountsTransferDialogComponent;
	let store: Store;

	let dialogRefSpy: jasmine.SpyObj<MatDialogRef<CrossAccountsTransferDialogComponent>>;
	let exchangeServiceSpy: jasmine.SpyObj<CurrencyExchangeService>;
	let paymentHistoryProviderSpy: jasmine.SpyObj<PaymentsHistoryProvider>;
	let submitSpy: jasmine.Spy<
		(payload: ICrossAccountsTransferModel) => Observable<Result<ICrossAccountsTransferResponse>>
	>;

	beforeEach(async () => {
		dialogRefSpy = jasmine.createSpyObj<MatDialogRef<CrossAccountsTransferDialogComponent>>('MatDialogRef', [
			'close',
		]);

		exchangeServiceSpy = jasmine.createSpyObj<CurrencyExchangeService>('exchangeService', {
			getExchange: of(new Result<number>({ payload: 1 })),
			getExchangeMultiplier: of(new Result<number>({ payload: 2.5 })),
		});

		paymentHistoryProviderSpy = jasmine.createSpyObj<PaymentsHistoryProvider>('paymentHistoryProvider', {
			GetHistoryOperationById: of({
				balance: 125,
				record: {
					key: transferOperationId,
					paymentAccountId: sourceAccountId,
					contractorId: Guid.EMPTY,
					categoryId: Guid.EMPTY,
					operationDate,
					comment: '',
					amount: 10,
					operationType: OperationTypes.Payment,
				},
			}),
		});

		submitSpy = jasmine
			.createSpy<
				(payload: ICrossAccountsTransferModel) => Observable<Result<ICrossAccountsTransferResponse>>
			>('onSubmit')
			.and.returnValue(
				of(
					new Result<ICrossAccountsTransferResponse>({
						payload: {
							paymentAccountIds: [sourceAccountId, targetAccountId],
							paymentOperationId: transferOperationId,
						},
					})
				)
			);

		await TestBed.configureTestingModule({
			imports: [
				CrossAccountsTransferDialogComponent,
				NoopAnimationsModule,
				NgxsModule.forRoot(
					[PaymentAccountState, AccountingOperationsTableState, AccountingOperationsState],
					ngxsConfig
				),
			],
			providers: [
				{
					provide: MatDialogRef,
					useValue: dialogRefSpy,
				},
				{
					provide: MAT_DIALOG_DATA,
					useValue: {
						title: 'Cross accounts transfer',
						onSubmit: submitSpy,
					} as DialogContainer<ICrossAccountsTransferModel, Result<ICrossAccountsTransferResponse>>,
				},
				{
					provide: CurrencyExchangeService,
					useValue: exchangeServiceSpy,
				},
				{
					provide: PaymentsHistoryProvider,
					useValue: paymentHistoryProviderSpy,
				},
			],
		}).compileComponents();

		store = TestBed.inject(Store);
		store.dispatch(new SetInitialPaymentAccounts(paymentAccounts));
		store.dispatch(new SetActivePaymentAccount(sourceAccountId.toString()));

		component = TestBed.createComponent(CrossAccountsTransferDialogComponent).componentInstance;
	});

	it('should create as a standalone TestBed import with the existing form structure', () => {
		expect(component).toBeTruthy();
		expect(component.title).toBe('Cross accounts transfer');
		expect(component.baseTransferStepFg.contains('transferDirections')).toBeTrue();
		expect(component.baseTransferStepFg.contains('targetAccount')).toBeTrue();
		expect(component.baseTransferStepFg.contains('operationDate')).toBeTrue();
		expect(component.confirmStepFg.contains('currencyRate')).toBeTrue();
		expect(component.confirmStepFg.contains('transferAmount')).toBeTrue();
	});

	it('should preserve the current no-validator form eligibility', () => {
		component.baseTransferStepFg.reset();
		component.confirmStepFg.reset();

		expect(component.baseTransferStepFg.valid).toBeTrue();
		expect(component.confirmStepFg.valid).toBeTrue();
	});

	it('should exclude the active source account from target account options', () => {
		const targetOptions = component.targetPaymentAccountTitlesSignal();

		expect(targetOptions.length).toBe(1);
		expect(targetOptions[0].value).toBe(targetAccountId.toString());
	});

	it('should patch the exchange multiplier for the selected transfer direction and accounts', () => {
		component.baseTransferStepFg.patchValue({
			transferDirections: component.getTransferDirections()[0],
			targetAccount: component.targetPaymentAccountTitlesSignal()[0],
			operationDate,
		});

		component.getMultiplier();

		expect(exchangeServiceSpy.getExchangeMultiplier).toHaveBeenCalledWith({
			originCurrency: 'BYN',
			targetCurrency: 'USD',
			operationDate,
		});
		expect(component.confirmStepFg.get('currencyRate')?.value).toBe(2.5);
	});

	it('should submit the transfer payload, load history, dispatch the transfer record, and close', () => {
		const dispatchSpy = spyOn(store, 'dispatch').and.callThrough();

		component.baseTransferStepFg.patchValue({
			transferDirections: component.getTransferDirections()[0],
			targetAccount: component.targetPaymentAccountTitlesSignal()[0],
			operationDate,
		});
		component.confirmStepFg.patchValue({
			currencyRate: 2.5,
			transferAmount: 10,
		});

		component.applyTransfer();

		expect(submitSpy).toHaveBeenCalledWith({
			sender: sourceAccountId,
			recipient: targetAccountId,
			amount: 10,
			multiplier: 2.5,
			operationAt: operationDate,
		});
		expect(paymentHistoryProviderSpy.GetHistoryOperationById).toHaveBeenCalledWith(
			sourceAccountId,
			transferOperationId
		);
		expect(dispatchSpy).toHaveBeenCalled();
		expect(dialogRefSpy.close).toHaveBeenCalled();
		expect(component.isLoadingSignal()).toBeFalse();
	});

	it('should close the dialog on cancel', () => {
		component.close();

		expect(dialogRefSpy.close).toHaveBeenCalled();
	});
});
