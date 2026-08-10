import { Injectable, signal } from '@angular/core';

import { Store } from '@ngxs/store';
import { forkJoin, map, Observable } from 'rxjs';
import { Guid } from 'typescript-guid';

import { SetActiveAccountingOperation } from '../../../app/modules/shared/store/states/accounting/actions/accounting-table-options.actions';
import { SetActivePaymentAccount } from '../../../app/modules/shared/store/states/accounting/actions/payment-account.actions';
import { IPaymentRepresentationModel } from '../models/operation-record';
import { AccountsService } from './accounts.service';
import { PaymentsHistoryService } from './payments-history.service';

interface IRelatedTransferNavigationTarget {
	paymentAccountId: Guid;
	operationKey: Guid;
}

@Injectable()
export class RelatedTransferNavigationService {
	private readonly pendingTargetSignal = signal<IRelatedTransferNavigationTarget | undefined>(undefined);

	constructor(
		private readonly accountsService: AccountsService,
		private readonly paymentsHistoryService: PaymentsHistoryService,
		private readonly store: Store
	) {}

	public navigateToRelatedTransfer(record: IPaymentRepresentationModel): Observable<IPaymentRepresentationModel[]> {
		const relatedPaymentAccountId = record.relatedPaymentAccountId;

		if (!relatedPaymentAccountId) {
			throw new Error('A related transfer navigation requires a related payment account ID.');
		}

		this.pendingTargetSignal.set({
			paymentAccountId: relatedPaymentAccountId,
			operationKey: record.key,
		});
		this.store.dispatch([
			new SetActivePaymentAccount(relatedPaymentAccountId.toString()),
			new SetActiveAccountingOperation(undefined),
		]);

		return forkJoin({
			payments: this.paymentsHistoryService.refreshPaymentsHistory(relatedPaymentAccountId),
			balance: this.accountsService.refreshAccounts(relatedPaymentAccountId),
		}).pipe(map(payload => payload.payments));
	}

	public hasPendingTargetForAccount(paymentAccountId: Guid | string): boolean {
		return this.pendingTargetSignal()?.paymentAccountId.toString() === paymentAccountId.toString();
	}

	public getPendingTargetOperationKey(paymentAccountId: Guid | string): Guid | undefined {
		const target = this.pendingTargetSignal();

		if (!target || target.paymentAccountId.toString() !== paymentAccountId.toString()) {
			return undefined;
		}

		return target.operationKey;
	}

	public completePendingTarget(paymentAccountId: Guid | string, operationKey: Guid): void {
		const target = this.pendingTargetSignal();

		if (
			!target ||
			target.paymentAccountId.toString() !== paymentAccountId.toString() ||
			!target.operationKey.equals(operationKey)
		) {
			return;
		}

		this.pendingTargetSignal.set(undefined);
		this.store.dispatch(new SetActiveAccountingOperation(target.operationKey));
	}
}
