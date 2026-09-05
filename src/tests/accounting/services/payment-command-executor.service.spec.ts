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
import { PendingPaymentCommand } from '../../../presentation/accounting/models/pending-payment-command';
import { AccountsService } from '../../../presentation/accounting/services/accounts.service';
import { PaymentCommandExecutorService } from '../../../presentation/accounting/services/payment-command-executor.service';
import { PendingPaymentCommandRegistryService } from '../../../presentation/accounting/services/pending-payment-command-registry.service';

describe('payment command executor service', () => {
	const accountId = '1c12ec59-8875-45c1-9fb0-e4edcf34a074';
	const commandId = '22222222-2222-2222-2222-222222222222';
	let service: PaymentCommandExecutorService;
	let accountsService: jasmine.SpyObj<AccountsService>;
	let provider: jasmine.SpyObj<PaymentOperationsProvider>;
	let registry: jasmine.SpyObj<PendingPaymentCommandRegistryService>;

	beforeEach(() => {
		accountsService = jasmine.createSpyObj<AccountsService>('AccountsService', ['refreshAccounts']);
		accountsService.refreshAccounts.and.returnValue(of(undefined));
		provider = jasmine.createSpyObj<PaymentOperationsProvider>('PaymentOperationsProvider', [
			'savePaymentOperation',
			'updatePaymentOperation',
			'removePaymentOperation',
			'getCommandStatus',
		]);
		registry = jasmine.createSpyObj<PendingPaymentCommandRegistryService>('PendingPaymentCommandRegistryService', [
			'save',
			'updateCommandId',
			'remove',
			'getAll',
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
				{ provide: PendingPaymentCommandRegistryService, useValue: registry },
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

	it('persists the pending intent before sending its mutation', async () => {
		provider.savePaymentOperation.and.callFake(() => {
			expect(registry.save.calls.count()).toBe(1);
			return of(commandResponse('Projected'));
		});

		await service.executeCreate(operation());
	});

	it('restores a known command by querying status without replaying its mutation', async () => {
		registry.getAll.and.returnValue([
			{
				...pendingCommand('create'),
				commandId,
			},
		]);
		provider.getCommandStatus.and.returnValue(
			of(
				new Result({
					isSucceeded: true,
					payload: { commandId, isDuplicate: false, status: 'Projected' as const },
				})
			)
		);

		await service.recoverPendingCommands();

		expect(provider.savePaymentOperation.calls.count()).toBe(0);
		expect(provider.getCommandStatus.calls.allArgs()).toEqual([[accountId, commandId]]);
		expect(registry.remove.calls.allArgs()).toContain(['restored-intent']);
		expect(accountsService.refreshAccounts.calls.count()).toBe(1);
	});

	it('replays a response-lost intent from registry data after recreating the route-scoped executor', async () => {
		let persistedCommands: PendingPaymentCommand[] = [];
		registry.save.and.callFake(command => {
			persistedCommands = [command];
		});
		registry.updateCommandId.and.callFake((intentId, recoveredCommandId, paymentOperationId) => {
			persistedCommands = persistedCommands.map(command => ({
				...command,
				commandId: recoveredCommandId,
				operationId: paymentOperationId,
			}));
		});
		registry.remove.and.callFake(intentId => {
			persistedCommands = persistedCommands.filter(command => command.intentId !== intentId);
		});
		registry.getAll.and.callFake(() => persistedCommands);
		provider.savePaymentOperation.and.returnValues(
			throwError(() => new HttpErrorResponse({ status: 0 })),
			throwError(() => new HttpErrorResponse({ status: 0 }))
		);

		const responseLost = await service.executeCreate(operation());
		provider.savePaymentOperation.and.returnValue(of(commandResponse('Projected')));
		const recreatedService = TestBed.runInInjectionContext(() => new PaymentCommandExecutorService());

		await recreatedService.recoverPendingCommands();

		expect(responseLost.status).toBe('unknown');
		expect(provider.savePaymentOperation.calls.allArgs()[0][2]).toBe(
			provider.savePaymentOperation.calls.mostRecent().args[2]
		);
		expect(registry.updateCommandId.calls.mostRecent().args).toEqual([jasmine.any(String), commandId, commandId]);
		expect(persistedCommands).toEqual([]);
	});

	it('replays a response-lost create with the original key and persists its recovered command id', async () => {
		registry.getAll.and.returnValue([pendingCommand('create')]);
		provider.savePaymentOperation.and.returnValue(of(commandResponse('Projected')));

		await service.recoverPendingCommands();

		expect(provider.savePaymentOperation.calls.mostRecent().args).toEqual([
			accountId,
			jasmine.objectContaining({
				amount: 10,
				comment: 'Rent',
				operationType: OperationTypes.Payment,
			}),
			'restored-key',
		]);
		expect(registry.updateCommandId.calls.mostRecent().args).toEqual(['restored-intent', commandId, commandId]);
		expect(registry.remove.calls.allArgs()).toContain(['restored-intent']);
	});

	it('replays an update with its original operation id, body, and key', async () => {
		registry.getAll.and.returnValue([pendingCommand('update')]);
		provider.updatePaymentOperation.and.returnValue(of(commandResponse('Projected')));

		await service.recoverPendingCommands();

		const [replayedOperation, replayedAccountId, replayedOperationId, replayedKey] =
			provider.updatePaymentOperation.calls.mostRecent().args;
		expect(replayedAccountId).toBe(accountId);
		expect(replayedOperationId).toBe(commandId);
		expect(replayedKey).toBe('restored-key');
		expect(replayedOperation).toEqual(
			jasmine.objectContaining({ amount: 10, comment: 'Rent', operationType: OperationTypes.Payment })
		);
	});

	it('replays a delete with its original account, operation id, and key', async () => {
		registry.getAll.and.returnValue([pendingCommand('delete')]);
		provider.removePaymentOperation.and.returnValue(of(commandResponse('Projected')));

		await service.recoverPendingCommands();

		expect(provider.removePaymentOperation.calls.mostRecent().args).toEqual([accountId, commandId, 'restored-key']);
		expect(registry.updateCommandId.calls.mostRecent().args).toEqual(['restored-intent', commandId, commandId]);
	});

	it('removes a restored command only after its failed terminal lifecycle state', async () => {
		registry.getAll.and.returnValue([{ ...pendingCommand('create'), commandId }]);
		provider.getCommandStatus.and.returnValue(
			of(new Result({ isSucceeded: true, payload: { commandId, isDuplicate: false, status: 'Failed' as const } }))
		);

		await service.recoverPendingCommands();

		expect(provider.savePaymentOperation.calls.count()).toBe(0);
		expect(registry.remove.calls.allArgs()).toContain(['restored-intent']);
		expect(accountsService.refreshAccounts.calls.count()).toBe(0);
	});

	it('retains a restored command when its status endpoint has a transient transport failure', async () => {
		registry.getAll.and.returnValue([{ ...pendingCommand('create'), commandId }]);
		provider.getCommandStatus.and.returnValue(throwError(() => new HttpErrorResponse({ status: 0 })));

		await service.recoverPendingCommands();

		expect(provider.savePaymentOperation.calls.count()).toBe(0);
		expect(registry.remove.calls.count()).toBe(0);
	});

	it('does not make recovery requests when the registry has already discarded expired commands', async () => {
		registry.getAll.and.returnValue([]);

		await service.recoverPendingCommands();

		expect(provider.savePaymentOperation.calls.count()).toBe(0);
		expect(provider.getCommandStatus.calls.count()).toBe(0);
	});

	function pendingCommand(action: 'create' | 'update' | 'delete') {
		return {
			version: 1,
			intentId: 'restored-intent',
			action,
			accountId,
			operationId: action === 'delete' ? commandId : undefined,
			idempotencyKey: 'restored-key',
			request:
				action === 'delete'
					? undefined
					: {
							amount: 10,
							categoryId: '44444444-4444-4444-4444-444444444444',
							comment: 'Rent',
							contractorId: '00000000-0000-0000-0000-000000000000',
							operationDate: '2026-01-01T00:00:00.000Z',
							operationId: action === 'update' ? commandId : '00000000-0000-0000-0000-000000000000',
							operationType: 1,
						},
			createdAt: '2026-01-01T00:00:00.000Z',
			updatedAt: '2026-01-01T00:00:00.000Z',
		};
	}

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
