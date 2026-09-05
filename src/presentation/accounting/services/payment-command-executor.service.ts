import { HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import { Store } from '@ngxs/store';
import { firstValueFrom, Observable, timer } from 'rxjs';
import { Guid } from 'typescript-guid';

import { AccountsService } from './accounts.service';
import { PendingPaymentCommandRegistryService } from './pending-payment-command-registry.service';
import { SetInitialPaymentOperations } from '../../../app/modules/shared/store/states/accounting/actions/payment-operation.actions';
import { Result } from '../../../core/result';
import { PaymentOperationsProvider } from '../../../data/providers/accounting/payment-operations.provider';
import { PaymentsHistoryProvider } from '../../../data/providers/accounting/payments-history.provider';
import { IPaymentOperationModel } from '../../../domain/models/accounting/payment-operation.model';
import { IPaymentAccountCreateOrUpdateResponse } from '../../../domain/models/accounting/responses/payment-account-create-or-update.response';
import { PaymentCommandExecutionResult } from '../models/payment-command-execution-result';
import { PaymentCommandIntent } from '../models/payment-command-intent';
import { PendingPaymentCommand } from '../models/pending-payment-command';

type PaymentCommandAction = 'create' | 'update' | 'delete';

const pollingDelaysMs = [500, 1_000, 1_000, 2_000, 2_000, 3_000, 3_000, 3_000, 3_000, 3_000] as const;

@Injectable()
export class PaymentCommandExecutorService {
	private readonly paymentOperationsProvider = inject(PaymentOperationsProvider);
	private readonly paymentsHistoryProvider = inject(PaymentsHistoryProvider);
	private readonly store = inject(Store);
	private readonly accountsService = inject(AccountsService);
	private readonly pendingCommandRegistry = inject(PendingPaymentCommandRegistryService);
	private recoveryPromise?: Promise<void>;

	public executeCreate(
		operation: IPaymentOperationModel,
		previousIntent?: PaymentCommandIntent,
		isActive: () => boolean = () => true,
		onProcessing: (commandId: string) => void = () => undefined
	): Promise<PaymentCommandExecutionResult> {
		return this.execute(
			'create',
			operation.paymentAccountId.toString(),
			operation,
			previousIntent,
			isActive,
			onProcessing
		);
	}

	public executeUpdate(
		operation: IPaymentOperationModel,
		previousIntent?: PaymentCommandIntent,
		isActive: () => boolean = () => true,
		onProcessing: (commandId: string) => void = () => undefined
	): Promise<PaymentCommandExecutionResult> {
		return this.execute(
			'update',
			operation.paymentAccountId.toString(),
			operation,
			previousIntent,
			isActive,
			onProcessing
		);
	}

	public executeDelete(
		accountId: string,
		operationId: string,
		previousIntent?: PaymentCommandIntent,
		isActive: () => boolean = () => true,
		onProcessing: (commandId: string) => void = () => undefined
	): Promise<PaymentCommandExecutionResult> {
		return this.execute('delete', accountId, operationId, previousIntent, isActive, onProcessing);
	}

	public recoverPendingCommands(): Promise<void> {
		this.recoveryPromise ??= Promise.all(
			this.pendingCommandRegistry.getAll().map(command => this.recoverPendingCommand(command))
		).then(() => undefined);
		return this.recoveryPromise;
	}

	private async execute(
		action: PaymentCommandAction,
		accountId: string,
		request: IPaymentOperationModel | string,
		previousIntent: PaymentCommandIntent | undefined,
		isActive: () => boolean,
		onProcessing: (commandId: string) => void
	): Promise<PaymentCommandExecutionResult> {
		const intent = this.intentFor(action, accountId, request, previousIntent);
		this.pendingCommandRegistry.save(this.pendingCommand(intent, request));
		const response = await this.submitAsync(action, accountId, request, intent.idempotencyKey);

		if (response.kind === 'unknown') {
			return { status: 'unknown', intent, message: 'Unable to confirm the payment. Retry to continue.' };
		}
		if (response.kind === 'conflict') {
			this.pendingCommandRegistry.remove(intent.intentId);
			return {
				status: 'conflict',
				message: 'This payment could not be confirmed. Please review the payment before trying again.',
			};
		}
		if (response.kind === 'failed') {
			this.pendingCommandRegistry.remove(intent.intentId);
			return { status: 'failed', message: 'The payment command could not be accepted.' };
		}
		if (!response.result.isSucceeded || !response.result.payload) {
			this.pendingCommandRegistry.remove(intent.intentId);
			return { status: 'failed', message: 'The payment command was rejected.' };
		}

		const command = response.result.payload;
		this.pendingCommandRegistry.updateCommandId(intent.intentId, command.commandId, command.paymentOperationId);
		const result = await this.observeCommandAsync(accountId, command, intent, isActive, onProcessing);
		this.removeTerminalIntent(intent, result);
		return result;
	}

	private async recoverPendingCommand(command: PendingPaymentCommand): Promise<void> {
		const intent = this.intentFromPendingCommand(command);
		if (command.commandId) {
			const result = await this.observeRestoredCommand(command, intent);
			this.removeTerminalIntent(intent, result);
			return;
		}

		const request = this.replayRequest(command);
		if (!request) {
			this.pendingCommandRegistry.remove(command.intentId);
			return;
		}
		const result = await this.execute(
			command.action,
			command.accountId,
			request,
			intent,
			() => true,
			() => undefined
		);
		this.removeTerminalIntent(intent, result);
	}

	private async observeRestoredCommand(
		command: PendingPaymentCommand,
		intent: PaymentCommandIntent
	): Promise<PaymentCommandExecutionResult> {
		const commandId = command.commandId;
		if (!commandId) {
			return { status: 'unknown', intent };
		}
		try {
			const statusResponse = await firstValueFrom(
				this.paymentOperationsProvider.getCommandStatus(command.accountId, commandId)
			);
			if (!statusResponse.isSucceeded || !statusResponse.payload) {
				return { status: 'unknown', intent, commandId };
			}
			return this.observeCommandAsync(
				command.accountId,
				{
					commandId,
					status: statusResponse.payload.status,
					paymentOperationId: command.operationId ?? '',
					paymentAccountId: command.accountId,
					paymentAccountBalance: 0,
					isDuplicate: statusResponse.payload.isDuplicate,
				},
				intent,
				() => true,
				() => undefined
			);
		} catch {
			return { status: 'unknown', intent, commandId };
		}
	}

	private async observeCommandAsync(
		accountId: string,
		command: IPaymentAccountCreateOrUpdateResponse,
		intent: PaymentCommandIntent,
		isActive: () => boolean,
		onProcessing: (commandId: string) => void
	): Promise<PaymentCommandExecutionResult> {
		let status = command.status;
		if (status === 'Projected') {
			await this.refreshProjectedStateAsync(accountId);
			return {
				status: 'projected',
				commandId: command.commandId,
				paymentOperationId: command.paymentOperationId,
			};
		}
		if (status === 'Failed') {
			return {
				status: 'failed',
				commandId: command.commandId,
				message: 'The payment command failed.',
				paymentOperationId: command.paymentOperationId,
			};
		}
		onProcessing(command.commandId);

		for (const delay of pollingDelaysMs) {
			if (!isActive()) {
				return { status: 'unknown', commandId: command.commandId, intent };
			}
			await firstValueFrom(timer(delay));
			if (!isActive()) {
				return { status: 'unknown', commandId: command.commandId, intent };
			}

			try {
				const statusResponse = await firstValueFrom(
					this.paymentOperationsProvider.getCommandStatus(accountId, command.commandId)
				);
				if (!statusResponse.isSucceeded || !statusResponse.payload) {
					continue;
				}
				status = statusResponse.payload.status;
				if (status === 'Projected') {
					await this.refreshProjectedStateAsync(accountId);
					return {
						status: 'projected',
						commandId: command.commandId,
						paymentOperationId: command.paymentOperationId,
					};
				}
				if (status === 'Failed') {
					return {
						status: 'failed',
						commandId: command.commandId,
						message: 'The payment command failed.',
						paymentOperationId: command.paymentOperationId,
					};
				}
			} catch {
				// A status read failure leaves the durable command outcome unknown; continue within the bound.
			}
		}

		return {
			status: 'unknown',
			commandId: command.commandId,
			intent,
			message: 'Payment is still processing. Retry to check its result.',
		};
	}

	private async submitAsync(
		action: PaymentCommandAction,
		accountId: string,
		request: IPaymentOperationModel | string,
		idempotencyKey: string
	): Promise<
		| { kind: 'response'; result: Result<IPaymentAccountCreateOrUpdateResponse> }
		| { kind: 'unknown' }
		| { kind: 'conflict' }
		| { kind: 'failed' }
	> {
		for (let attempt = 0; attempt < 2; attempt++) {
			try {
				return {
					kind: 'response',
					result: await firstValueFrom(this.mutation(action, accountId, request, idempotencyKey)),
				};
			} catch (error: unknown) {
				if (this.isConflict(error)) {
					return { kind: 'conflict' };
				}
				if (this.isTransient(error)) {
					if (attempt === 1) {
						return { kind: 'unknown' };
					}
					continue;
				}
				return error instanceof HttpErrorResponse ? { kind: 'failed' } : { kind: 'unknown' };
			}
		}

		return { kind: 'unknown' };
	}

	private mutation(
		action: PaymentCommandAction,
		accountId: string,
		request: IPaymentOperationModel | string,
		idempotencyKey: string
	): Observable<Result<IPaymentAccountCreateOrUpdateResponse>> {
		if (action === 'delete') {
			return this.paymentOperationsProvider.removePaymentOperation(accountId, request as string, idempotencyKey);
		}

		if (typeof request === 'string') {
			throw new Error('Payment create and update commands require a payment operation.');
		}
		const operation = request;
		return action === 'create'
			? this.paymentOperationsProvider.savePaymentOperation(accountId, operation, idempotencyKey)
			: this.paymentOperationsProvider.updatePaymentOperation(
					operation,
					accountId,
					operation.key.toString(),
					idempotencyKey
				);
	}

	private async refreshProjectedStateAsync(accountId: string): Promise<void> {
		try {
			const history = await firstValueFrom(
				this.paymentsHistoryProvider.getOperationsHistoryForPaymentAccount(accountId)
			);
			await firstValueFrom(
				this.store.dispatch(new SetInitialPaymentOperations(history.map(item => item.record)))
			);
		} catch {
			// Command projection is authoritative; a subsequent history notification can repair this local read failure.
		}

		try {
			await firstValueFrom(this.accountsService.refreshAccounts(accountId));
		} catch {
			// A read-model refresh failure cannot change the already projected command outcome.
		}
	}

	private intentFor(
		action: PaymentCommandAction,
		accountId: string,
		request: IPaymentOperationModel | string,
		previousIntent: PaymentCommandIntent | undefined
	): PaymentCommandIntent {
		const requestFingerprint = this.fingerprint(action, request);
		if (
			previousIntent &&
			previousIntent.action === action &&
			previousIntent.accountId === accountId &&
			previousIntent.requestFingerprint === requestFingerprint
		) {
			return previousIntent;
		}

		return {
			action,
			accountId,
			idempotencyKey: crypto.randomUUID(),
			intentId: crypto.randomUUID(),
			requestFingerprint,
		};
	}

	private intentFromPendingCommand(command: PendingPaymentCommand): PaymentCommandIntent {
		const request = this.replayRequest(command);
		return {
			action: command.action,
			accountId: command.accountId,
			idempotencyKey: command.idempotencyKey,
			intentId: command.intentId,
			requestFingerprint: request
				? this.fingerprint(command.action, request)
				: this.fingerprint(command.action, command.operationId ?? ''),
		};
	}

	private pendingCommand(
		intent: PaymentCommandIntent,
		request: IPaymentOperationModel | string
	): PendingPaymentCommand {
		const now = new Date().toISOString();
		if (typeof request === 'string') {
			return {
				version: 1,
				intentId: intent.intentId,
				action: intent.action,
				accountId: intent.accountId,
				operationId: request,
				idempotencyKey: intent.idempotencyKey,
				createdAt: now,
				updatedAt: now,
			};
		}
		return {
			version: 1,
			intentId: intent.intentId,
			action: intent.action,
			accountId: intent.accountId,
			operationId: intent.action === 'update' ? request.key.toString() : undefined,
			idempotencyKey: intent.idempotencyKey,
			request: {
				amount: request.amount,
				categoryId: request.categoryId.toString(),
				comment: request.comment,
				contractorId: request.contractorId.toString(),
				operationDate: request.operationDate.toISOString(),
				operationId: request.key.toString(),
				operationType: request.operationType,
			},
			createdAt: now,
			updatedAt: now,
		};
	}

	private replayRequest(command: PendingPaymentCommand): IPaymentOperationModel | string | undefined {
		if (command.action === 'delete') {
			return command.operationId;
		}
		const request = command.request;
		if (!request) {
			return undefined;
		}
		try {
			return {
				key: Guid.parse(request.operationId),
				paymentAccountId: Guid.parse(command.accountId),
				operationDate: new Date(request.operationDate),
				contractorId: Guid.parse(request.contractorId),
				categoryId: Guid.parse(request.categoryId),
				comment: request.comment,
				amount: request.amount,
				operationType: request.operationType,
			};
		} catch {
			return undefined;
		}
	}

	private removeTerminalIntent(intent: PaymentCommandIntent, result: PaymentCommandExecutionResult): void {
		if (result.status === 'projected' || result.status === 'failed' || result.status === 'conflict') {
			this.pendingCommandRegistry.remove(intent.intentId);
		}
	}

	private fingerprint(action: PaymentCommandAction, request: IPaymentOperationModel | string): string {
		if (typeof request === 'string') {
			return `${action}:${request}`;
		}

		return JSON.stringify({
			action,
			amount: request.amount,
			categoryId: request.categoryId.toString(),
			comment: request.comment,
			contractorId: request.contractorId.toString(),
			operationDate: request.operationDate.toISOString(),
			operationId: request.key.toString(),
		});
	}

	private isConflict(error: unknown): boolean {
		return error instanceof HttpErrorResponse && error.status === 409;
	}

	private isTransient(error: unknown): boolean {
		return error instanceof HttpErrorResponse && [0, 408, 502, 503, 504].includes(error.status);
	}
}
