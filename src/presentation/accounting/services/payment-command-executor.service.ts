import { HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import { Store } from '@ngxs/store';
import { firstValueFrom, Observable, timer } from 'rxjs';

import { AccountsService } from './accounts.service';
import { SetInitialPaymentOperations } from '../../../app/modules/shared/store/states/accounting/actions/payment-operation.actions';
import { Result } from '../../../core/result';
import { PaymentOperationsProvider } from '../../../data/providers/accounting/payment-operations.provider';
import { PaymentsHistoryProvider } from '../../../data/providers/accounting/payments-history.provider';
import { IPaymentOperationModel } from '../../../domain/models/accounting/payment-operation.model';
import { IPaymentAccountCreateOrUpdateResponse } from '../../../domain/models/accounting/responses/payment-account-create-or-update.response';
import { PaymentCommandExecutionResult } from '../models/payment-command-execution-result';
import { PaymentCommandIntent } from '../models/payment-command-intent';

type PaymentCommandAction = 'create' | 'update' | 'delete';

const pollingDelaysMs = [500, 1_000, 1_000, 2_000, 2_000, 3_000, 3_000, 3_000, 3_000, 3_000] as const;

@Injectable()
export class PaymentCommandExecutorService {
	private readonly paymentOperationsProvider = inject(PaymentOperationsProvider);
	private readonly paymentsHistoryProvider = inject(PaymentsHistoryProvider);
	private readonly store = inject(Store);
	private readonly accountsService = inject(AccountsService);

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

	private async execute(
		action: PaymentCommandAction,
		accountId: string,
		request: IPaymentOperationModel | string,
		previousIntent: PaymentCommandIntent | undefined,
		isActive: () => boolean,
		onProcessing: (commandId: string) => void
	): Promise<PaymentCommandExecutionResult> {
		const intent = this.intentFor(action, accountId, request, previousIntent);
		const response = await this.submitAsync(action, accountId, request, intent.idempotencyKey);

		if (response.kind === 'unknown') {
			return { status: 'unknown', intent, message: 'Unable to confirm the payment. Retry to continue.' };
		}
		if (response.kind === 'conflict') {
			return {
				status: 'conflict',
				message: 'This payment could not be confirmed. Please review the payment before trying again.',
			};
		}
		if (response.kind === 'failed') {
			return { status: 'failed', message: 'The payment command could not be accepted.' };
		}
		if (!response.result.isSucceeded || !response.result.payload) {
			return { status: 'failed', message: 'The payment command was rejected.' };
		}

		const command = response.result.payload;
		return this.observeCommandAsync(accountId, command, intent, isActive, onProcessing);
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

		return { action, accountId, idempotencyKey: crypto.randomUUID(), requestFingerprint };
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
