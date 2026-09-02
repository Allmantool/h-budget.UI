import { TestBed } from '@angular/core/testing';
import { Result } from 'core/result';

import { NgxsModule, Store } from '@ngxs/store';
import { Subject } from 'rxjs';
import { Guid } from 'typescript-guid';

import { ngxsConfig } from '../../../app/modules/shared/store/ngxs.config';
import { AccountingOperationsTableState } from '../../../app/modules/shared/store/states/accounting/accounting-operations-table.state';
import { SetActivePaymentAccount } from '../../../app/modules/shared/store/states/accounting/actions/payment-account.actions';
import {
	Edit,
	SetInitialPaymentOperations,
} from '../../../app/modules/shared/store/states/accounting/actions/payment-operation.actions';
import { PaymentAccountState } from '../../../app/modules/shared/store/states/accounting/payment-account.state';
import { AccountingOperationsState } from '../../../app/modules/shared/store/states/accounting/payment-operations.state';
import { PaymentOperationsProvider } from '../../../data/providers/accounting/payment-operations.provider';
import { PaymentsHistoryProvider } from '../../../data/providers/accounting/payments-history.provider';
import { IPaymentOperationModel } from '../../../domain/models/accounting/payment-operation.model';
import { IPaymentAccountCreateOrUpdateResponse } from '../../../domain/models/accounting/responses/payment-account-create-or-update.response';
import { OperationTypes } from '../../../domain/types/operation.types';
import { AccountingOperationsService } from '../../../presentation/accounting/services/accounting-operations.service';

describe('accounting operations state safety', () => {
	it('does not replace a confirmed record when an edit targets an unknown operation', () => {
		TestBed.configureTestingModule({
			imports: [NgxsModule.forRoot([AccountingOperationsState, AccountingOperationsTableState], ngxsConfig)],
		});
		const store = TestBed.inject(Store);
		const accountId = Guid.parse('1c12ec59-8875-45c1-9fb0-e4edcf34a074');
		const first = createOperation('11111111-1111-1111-1111-111111111111', accountId);
		const second = createOperation('22222222-2222-2222-2222-222222222222', accountId);

		store.dispatch(new SetInitialPaymentOperations([first, second]));
		store.dispatch(new Edit(createOperation('33333333-3333-3333-3333-333333333333', accountId)));

		const records = store.selectSnapshot(
			(state: { accountingOperations: { operationRecords: IPaymentOperationModel[] } }) =>
				state.accountingOperations.operationRecords
		);
		expect(records.map(record => record.key.toString())).toEqual([first.key.toString(), second.key.toString()]);
	});

	function createOperation(id: string, paymentAccountId: Guid): IPaymentOperationModel {
		return {
			key: Guid.parse(id),
			paymentAccountId,
			operationDate: new Date(),
			contractorId: Guid.EMPTY,
			categoryId: Guid.EMPTY,
			comment: '',
			amount: 1,
			operationType: OperationTypes.Payment,
		};
	}
});

describe('accounting operations service single-flight writes', () => {
	const accountId = '1c12ec59-8875-45c1-9fb0-e4edcf34a074';
	let service: AccountingOperationsService;
	let paymentOperationsProvider: jasmine.SpyObj<PaymentOperationsProvider>;

	beforeEach(() => {
		paymentOperationsProvider = jasmine.createSpyObj<PaymentOperationsProvider>('PaymentOperationsProvider', [
			'savePaymentOperation',
			'updatePaymentOperation',
			'removePaymentOperation',
		]);
		const paymentsHistoryProvider = jasmine.createSpyObj<PaymentsHistoryProvider>('PaymentsHistoryProvider', [
			'GetHistoryOperationById',
			'getOperationsHistoryForPaymentAccount',
		]);

		TestBed.configureTestingModule({
			imports: [NgxsModule.forRoot([PaymentAccountState], ngxsConfig)],
			providers: [
				AccountingOperationsService,
				{ provide: PaymentOperationsProvider, useValue: paymentOperationsProvider },
				{ provide: PaymentsHistoryProvider, useValue: paymentsHistoryProvider },
			],
		});
		TestBed.inject(Store).dispatch(new SetActivePaymentAccount(accountId));
		service = TestBed.inject(AccountingOperationsService);
	});

	it('rejects a duplicate create while the first command is pending', async () => {
		const pendingResponse = pendingWriteResponse();
		paymentOperationsProvider.savePaymentOperation.and.returnValue(pendingResponse);

		const first = service.updateAsync(createOperation(Guid.EMPTY, Guid.parse(accountId)));
		const duplicate = await service.updateAsync(createOperation(Guid.EMPTY, Guid.parse(accountId)));

		expect(paymentOperationsProvider.savePaymentOperation.calls.count()).toBe(1);
		expect(duplicate.isSucceeded).toBeFalse();
		completeWriteResponse(pendingResponse, '11111111-1111-1111-1111-111111111111');
		await first;
	});

	it('rejects a duplicate update while the first command is pending', async () => {
		const pendingResponse = pendingWriteResponse();
		paymentOperationsProvider.updatePaymentOperation.and.returnValue(pendingResponse);
		const operation = createOperation(Guid.parse('22222222-2222-2222-2222-222222222222'), Guid.parse(accountId));

		const first = service.updateAsync(operation);
		const duplicate = await service.updateAsync(operation);

		expect(paymentOperationsProvider.updatePaymentOperation.calls.count()).toBe(1);
		expect(duplicate.isSucceeded).toBeFalse();
		completeWriteResponse(pendingResponse, operation.key.toString());
		await first;
	});

	it('rejects a duplicate delete while the first command is pending', async () => {
		const pendingResponse = pendingWriteResponse();
		paymentOperationsProvider.removePaymentOperation.and.returnValue(pendingResponse);
		const operationId = Guid.parse('33333333-3333-3333-3333-333333333333');

		const first = service.deleteByIdAsync(operationId);
		const duplicate = await service.deleteByIdAsync(operationId);

		expect(paymentOperationsProvider.removePaymentOperation.calls.count()).toBe(1);
		expect(duplicate.isSucceeded).toBeFalse();
		completeWriteResponse(pendingResponse, operationId.toString());
		await first;
	});

	function pendingWriteResponse(): Subject<Result<IPaymentAccountCreateOrUpdateResponse>> {
		return new Subject<Result<IPaymentAccountCreateOrUpdateResponse>>();
	}

	function completeWriteResponse(
		response: Subject<Result<IPaymentAccountCreateOrUpdateResponse>>,
		operationId: string
	): void {
		response.next(
			new Result({
				isSucceeded: true,
				payload: {
					paymentAccountId: accountId,
					paymentAccountBalance: 0,
					paymentOperationId: operationId,
				},
			})
		);
		response.complete();
	}

	function createOperation(key: Guid, paymentAccountId: Guid): IPaymentOperationModel {
		return {
			key,
			paymentAccountId,
			operationDate: new Date(2026, 0, 1),
			contractorId: Guid.EMPTY,
			categoryId: Guid.parse('44444444-4444-4444-4444-444444444444'),
			comment: '',
			amount: 1,
			operationType: OperationTypes.Payment,
		};
	}
});
