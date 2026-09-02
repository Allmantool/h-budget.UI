import { Injectable, Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Result } from 'core/result';

import { Select, Store } from '@ngxs/store';
import { firstValueFrom, Observable, timer } from 'rxjs';
import { Guid } from 'typescript-guid';

import { getActivePaymentAccountId } from '../../../app/modules/shared/store/states/accounting/selectors/payment-account.selector';
import {
	Add,
	Delete,
	Edit,
} from '../../../app/modules/shared/store/states/accounting/actions/payment-operation.actions';
import { PaymentOperationsProvider } from '../../../data/providers/accounting/payment-operations.provider';
import { PaymentsHistoryProvider } from '../../../data/providers/accounting/payments-history.provider';
import { IPaymentOperationModel } from '../../../domain/models/accounting/payment-operation.model';

@Injectable()
export class AccountingOperationsService {
	private readonly inFlightWriteKeys = new Set<string>();
	@Select(getActivePaymentAccountId)
	public activePaymentAccountId$!: Observable<string>;

	public readonly activePaymentAccountIdSignal: Signal<string>;

	constructor(
		private readonly paymentOperationsProvider: PaymentOperationsProvider,
		private readonly paymentsHistoryProvider: PaymentsHistoryProvider,
		private readonly store: Store
	) {
		this.activePaymentAccountIdSignal = toSignal(this.activePaymentAccountId$, { initialValue: '' });
	}

	public async deleteByIdAsync(operationGuid: Guid): Promise<Result<string>> {
		const writeKey = `delete:${operationGuid.toString()}`;
		if (!this.startWrite(writeKey)) {
			return new Result({ isSucceeded: false, message: 'Payment deletion is already in progress.' });
		}

		try {
			const response = await firstValueFrom(
				this.paymentOperationsProvider.removePaymentOperation(
					this.activePaymentAccountIdSignal(),
					operationGuid.toString()
				)
			);

			return response.isSucceeded
				? new Result({ isSucceeded: true, payload: operationGuid.toString() })
				: new Result({ isSucceeded: false, message: 'Payment could not be deleted.' });
		} finally {
			this.inFlightWriteKeys.delete(writeKey);
		}
	}

	public async updateAsync(payment: IPaymentOperationModel): Promise<Result<string>> {
		const writeKey = payment.key.equals(Guid.EMPTY)
			? `create:${this.activePaymentAccountIdSignal()}`
			: `update:${payment.key.toString()}`;
		if (!this.startWrite(writeKey)) {
			return new Result({ isSucceeded: false, message: 'Payment save is already in progress.' });
		}

		try {
			const response = payment.key.equals(Guid.EMPTY)
				? await firstValueFrom(
						this.paymentOperationsProvider.savePaymentOperation(
							this.activePaymentAccountIdSignal(),
							payment
						)
					)
				: await firstValueFrom(
						this.paymentOperationsProvider.updatePaymentOperation(
							payment,
							this.activePaymentAccountIdSignal(),
							payment.key.toString()
						)
					);

			if (!response.isSucceeded || !response.payload?.paymentOperationId) {
				return new Result({ isSucceeded: false, message: 'Payment could not be saved.' });
			}

			return new Result({ isSucceeded: true, payload: response.payload.paymentOperationId });
		} finally {
			this.inFlightWriteKeys.delete(writeKey);
		}
	}

	public async reconcileProjectionAsync(
		operationId: string,
		operation: 'create' | 'update' | 'delete',
		expectedOperation: IPaymentOperationModel | undefined,
		isCurrent: () => boolean
	): Promise<boolean> {
		for (const delay of [0, 500, 1_000, 2_000, 3_000]) {
			if (!isCurrent()) {
				return false;
			}

			if (delay > 0) {
				await firstValueFrom(timer(delay));
			}

			if (!isCurrent()) {
				return false;
			}

			if (operation === 'delete') {
				const isRemoved = await this.isOperationRemovedAsync(operationId);

				if (isRemoved) {
					await firstValueFrom(this.store.dispatch(new Delete(Guid.parse(operationId))));
					return true;
				}
				continue;
			}

			const projectedOperation = await this.getProjectedOperationAsync(operationId);

			if (projectedOperation && this.matchesExpectedProjection(projectedOperation, expectedOperation)) {
				await firstValueFrom(
					this.store.dispatch(
						operation === 'create' ? new Add(projectedOperation) : new Edit(projectedOperation)
					)
				);
				return true;
			}
		}

		return false;
	}

	private async getProjectedOperationAsync(operationId: string): Promise<IPaymentOperationModel | undefined> {
		try {
			const history = await firstValueFrom(
				this.paymentsHistoryProvider.GetHistoryOperationById(this.activePaymentAccountIdSignal(), operationId)
			);

			return history.record;
		} catch {
			return undefined;
		}
	}

	private async isOperationRemovedAsync(operationId: string): Promise<boolean> {
		try {
			const history = await firstValueFrom(
				this.paymentsHistoryProvider.getOperationsHistoryForPaymentAccount(this.activePaymentAccountIdSignal())
			);

			return !history.some(item => item.record.key.toString() === operationId);
		} catch {
			return false;
		}
	}

	private startWrite(writeKey: string): boolean {
		if (this.inFlightWriteKeys.has(writeKey)) {
			return false;
		}

		this.inFlightWriteKeys.add(writeKey);
		return true;
	}

	private matchesExpectedProjection(
		projected: IPaymentOperationModel,
		expected: IPaymentOperationModel | undefined
	): boolean {
		if (!expected) {
			return true;
		}

		return (
			projected.amount === expected.amount &&
			projected.categoryId.equals(expected.categoryId) &&
			projected.contractorId.equals(expected.contractorId) &&
			projected.comment === expected.comment &&
			this.isSameLocalDate(projected.operationDate, expected.operationDate)
		);
	}

	private isSameLocalDate(first: Date, second: Date): boolean {
		return (
			first.getFullYear() === second.getFullYear() &&
			first.getMonth() === second.getMonth() &&
			first.getDate() === second.getDate()
		);
	}
}
