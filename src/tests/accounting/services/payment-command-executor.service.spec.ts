import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Result } from 'core/result';

import { NgxsModule, Store } from '@ngxs/store';
import { of, throwError } from 'rxjs';
import { Guid } from 'typescript-guid';

import { ngxsConfig } from '../../../app/modules/shared/store/ngxs.config';
import { SetActivePaymentAccount } from '../../../app/modules/shared/store/states/accounting/actions/payment-account.actions';
import { PaymentAccountState } from '../../../app/modules/shared/store/states/accounting/payment-account.state';
import { PaymentOperationsProvider } from '../../../data/providers/accounting/payment-operations.provider';
import { PaymentsHistoryProvider } from '../../../data/providers/accounting/payments-history.provider';
import { IPaymentOperationModel } from '../../../domain/models/accounting/payment-operation.model';
import { OperationTypes } from '../../../domain/types/operation.types';
import { AccountsService } from '../../../presentation/accounting/services/accounts.service';
import { PaymentCommandExecutorService } from '../../../presentation/accounting/services/payment-command-executor.service';

describe('payment command executor service', () => {
	const accountId = '1c12ec59-8875-45c1-9fb0-e4edcf34a074';
	const commandId = '22222222-2222-2222-2222-222222222222';
	let service: PaymentCommandExecutorService;
	let provider: jasmine.SpyObj<PaymentOperationsProvider>;

	beforeEach(() => {
		const accountsService = jasmine.createSpyObj<AccountsService>('AccountsService', ['refreshAccounts']);
		accountsService.refreshAccounts.and.returnValue(of(undefined));
		provider = jasmine.createSpyObj<PaymentOperationsProvider>('PaymentOperationsProvider', [
			'savePaymentOperation',
			'updatePaymentOperation',
			'removePaymentOperation',
			'getCommandStatus',
		]);
		TestBed.configureTestingModule({
			imports: [NgxsModule.forRoot([PaymentAccountState], ngxsConfig)],
			providers: [
				PaymentCommandExecutorService,
				{ provide: PaymentOperationsProvider, useValue: provider },
				{
					provide: PaymentsHistoryProvider,
					useValue: jasmine.createSpyObj<PaymentsHistoryProvider>('PaymentsHistoryProvider', [
						'getOperationsHistoryForPaymentAccount',
					]),
				},
				{ provide: AccountsService, useValue: accountsService },
			],
		});
		TestBed.inject(Store).dispatch(new SetActivePaymentAccount(accountId));
		service = TestBed.inject(PaymentCommandExecutorService);
	});

	it('reuses the same key when an unchanged create is retried after response loss', async () => {
		provider.savePaymentOperation.and.returnValues(
			throwError(() => new HttpErrorResponse({ status: 0 })),
			throwError(() => new HttpErrorResponse({ status: 0 })),
			of(commandResponse('Projected'))
		);

		const first = await service.executeCreate(operation());
		const retry = await service.executeCreate(operation(), first.intent);

		expect(first.status).toBe('unknown');
		expect(retry.status).toBe('projected');
		expect(provider.savePaymentOperation.calls.allArgs()[0][2]).toBe(
			provider.savePaymentOperation.calls.allArgs()[2][2]
		);
	});

	it('creates a new key when an uncertain create payload materially changes', async () => {
		provider.savePaymentOperation.and.returnValues(
			throwError(() => new HttpErrorResponse({ status: 0 })),
			throwError(() => new HttpErrorResponse({ status: 0 })),
			of(commandResponse('Projected'))
		);

		const first = await service.executeCreate(operation());
		const changed = await service.executeCreate(operation(25), first.intent);

		expect(changed.status).toBe('projected');
		expect(provider.savePaymentOperation.calls.allArgs()[0][2]).not.toBe(
			provider.savePaymentOperation.calls.allArgs()[2][2]
		);
	});

	it('treats idempotency conflict as an explicit terminal conflict without a new key', async () => {
		provider.savePaymentOperation.and.returnValue(throwError(() => new HttpErrorResponse({ status: 409 })));

		const result = await service.executeCreate(operation());

		expect(result.status).toBe('conflict');
		expect(provider.savePaymentOperation.calls.count()).toBe(1);
	});

	it('reports the backend failed lifecycle state as terminal', async () => {
		provider.savePaymentOperation.and.returnValue(of(commandResponse('Failed')));

		const result = await service.executeCreate(operation());

		expect(result.status).toBe('failed');
		expect(result.intent).toBeUndefined();
	});

	it('polls an accepted command to projected without overlapping status requests', async () => {
		jasmine.clock().install();
		provider.savePaymentOperation.and.returnValue(of(commandResponse('Accepted')));
		provider.getCommandStatus.and.returnValue(
			of(
				new Result({
					isSucceeded: true,
					payload: { commandId, isDuplicate: false, status: 'Projected' as const },
				})
			)
		);

		try {
			const execution = service.executeCreate(operation());
			await Promise.resolve();
			await Promise.resolve();
			jasmine.clock().tick(500);
			const result = await execution;

			expect(result.status).toBe('projected');
			expect(provider.getCommandStatus.calls.count()).toBe(1);
		} finally {
			jasmine.clock().uninstall();
		}
	});

	function commandResponse(status: 'Accepted' | 'Projected' | 'Failed'): Result<{
		commandId: string;
		isDuplicate: boolean;
		paymentAccountBalance: number;
		paymentAccountId: string;
		paymentOperationId: string;
		status: 'Accepted' | 'Projected' | 'Failed';
	}> {
		return new Result({
			isSucceeded: true,
			payload: {
				commandId,
				isDuplicate: true,
				paymentAccountBalance: 0,
				paymentAccountId: accountId,
				paymentOperationId: commandId,
				status,
			},
		});
	}

	function operation(amount = 10): IPaymentOperationModel {
		return {
			key: Guid.EMPTY,
			paymentAccountId: Guid.parse(accountId),
			operationDate: new Date(2026, 0, 1),
			contractorId: Guid.EMPTY,
			categoryId: Guid.parse('44444444-4444-4444-4444-444444444444'),
			comment: 'Rent',
			amount,
			operationType: OperationTypes.Payment,
		};
	}
});
