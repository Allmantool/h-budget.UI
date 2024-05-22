/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { TestBed } from '@angular/core/testing';

import { NgxsModule, Store } from '@ngxs/store';
import { of, Subscription } from 'rxjs';
import { Guid } from 'typescript-guid';

import { Result } from 'core/result';

import { ngxsConfig } from '../../../app/modules/shared/store/ngxs.config';
import { AccountingOperationsTableState } from '../../../app/modules/shared/store/states/accounting/accounting-operations-table.state';
import { SetActivePaymentAccount } from '../../../app/modules/shared/store/states/accounting/actions/payment-account.actions';
import { PaymentAccountState } from '../../../app/modules/shared/store/states/accounting/payment-account.state';
import { AccountingOperationsState } from '../../../app/modules/shared/store/states/accounting/payment-operations.state';
import { DefaultPaymentAccountsProvider } from '../../../data/providers/accounting/payment-accounts.provider';
import { PaymentOperationsProvider } from '../../../data/providers/accounting/payment-operations.provider';
import { AccountTypes } from '../../../domain/models/accounting/account-types';
import { IPaymentAccountModel } from '../../../domain/models/accounting/payment-account.model';
import { IPaymentOperationModel } from '../../../domain/models/accounting/payment-operation.model';
import { IPaymentAccountCreateOrUpdateResponse } from '../../../domain/models/accounting/responses/payment-account-create-or-update.response';
import { AccountingOperationsService } from '../../../presentation/accounting/services/accounting-operations.service';
import { PaymentsHistoryService } from '../../../presentation/accounting/services/payments-history.service';

describe('accounting operations service', () => {
	let sut: AccountingOperationsService;

	let paymentsHistoryServiceSpy: PaymentsHistoryService;
	let paymentOperationsProviderSpy: PaymentOperationsProvider;
	let paymentAccountsProviderSpy: DefaultPaymentAccountsProvider;

	let store: Store;

	beforeEach(() => {
		paymentsHistoryServiceSpy = jasmine.createSpyObj('paymentsHistoryService', {
			refreshPaymentOperationsStore: () => Subscription,
		});

		paymentAccountsProviderSpy = jasmine.createSpyObj<DefaultPaymentAccountsProvider>('paymentAccountsProvider', {
			getById: of({
				key: Guid.parse('464f061b-23e2-4b9d-af69-dbe1ab2d25e9'),
				balance: 0.11,
				currency: 'USD',
				description: 'test-description',
				emitter: 'emitter-test',
				type: AccountTypes.WalletCache,
			} as IPaymentAccountModel),
		});

		paymentOperationsProviderSpy = jasmine.createSpyObj('paymentOperationsProvider', {
			updatePaymentOperation: of(
				new Result<IPaymentAccountCreateOrUpdateResponse>(
					new Result({
						payload: {
							paymentOperationId: 'b47b8ba6-0b04-4d2c-be79-1a2994410f99',
						} as IPaymentAccountCreateOrUpdateResponse,
						isSucceeded: true,
					})
				)
			),
			savePaymentOperation: of(
				new Result<IPaymentAccountCreateOrUpdateResponse>(
					new Result({
						payload: {
							paymentOperationId: 'b47b8ba6-0b04-4d2c-be79-1a2994410f99',
						} as IPaymentAccountCreateOrUpdateResponse,
						isSucceeded: true,
					})
				)
			),
			removePaymentOperation: of(
				new Result<IPaymentAccountCreateOrUpdateResponse>(
					new Result({
						isSucceeded: true,
					})
				)
			),
		});

		TestBed.configureTestingModule({
			imports: [
				NgxsModule.forRoot(
					[PaymentAccountState, AccountingOperationsState, AccountingOperationsTableState],
					ngxsConfig
				),
			],
			providers: [
				AccountingOperationsService,
				{
					provide: PaymentsHistoryService,
					useValue: paymentsHistoryServiceSpy,
				},
				{
					provide: PaymentOperationsProvider,
					useValue: paymentOperationsProviderSpy,
				},
				{
					provide: DefaultPaymentAccountsProvider,
					useValue: paymentAccountsProviderSpy,
				},
			],
		});

		store = TestBed.inject(Store);
		sut = TestBed.inject(AccountingOperationsService);

		store.dispatch(new SetActivePaymentAccount('1c12ec59-8875-45c1-9fb0-e4edcf34a074'));
	});

	it('should execute "addOperationAsync" successfully', async () => {
		const result = await sut.addNewAsync();

		expect(result.isSucceeded).toBeTruthy();
	});

	it('should execute "deleteOperationByGuidAsync" successfully', async () => {
		store.dispatch(new SetActivePaymentAccount('1c12ec59-8875-45c1-9fb0-e4edcf34a074'));

		const operationForDeleteGuid = Guid.parse('b47b8ba6-0b04-4d2c-be79-1a2994410f99');

		const result = await sut.deleteByIdAsync(operationForDeleteGuid);

		expect(result.isSucceeded).toBeTruthy();
	});

	it('should execute "updateOperationAsync" successfully', async () => {
		store.dispatch(new SetActivePaymentAccount('1c12ec59-8875-45c1-9fb0-e4edcf34a074'));

		const payload: IPaymentOperationModel = {
			key: Guid.parse('b47b8ba6-0b04-4d2c-be79-1a2994410f99'),
			amount: 0,
			categoryId: Guid.parse('5121c599-dbf5-483e-86bc-3fa0a9e39d81'),
			contractorId: Guid.parse('b95dc91c-0c58-4d3f-8755-d6607bba86f7'),
			paymentAccountId: Guid.parse('1c12ec59-8875-45c1-9fb0-e4edcf34a074'),
			operationDate: new Date(),
			comment: 'test comments while update',
		};

		const result = await sut.updateAsync(payload);

		expect(result.isSucceeded).toBeTruthy();
	});
});
