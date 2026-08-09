import { ChangeDetectionStrategy, Component, computed, OnInit, signal, Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { CrossAccountsTransferService } from 'presentation/accounting/services/cross-accounts-transfer.dialog.service';
import { TransferProjectionSynchronizationService } from 'presentation/accounting/services/transfer-projection-synchronization.service';

import _ from 'lodash';

import { Select, Store } from '@ngxs/store';
import { isFuture, isPast } from 'date-fns';
import { Observable } from 'rxjs';
import { Guid } from 'typescript-guid';

import { SetActiveAccountingOperation } from '../../../../app/modules/shared/store/states/accounting/actions/accounting-table-options.actions';
import { SetActivePaymentAccount } from '../../../../app/modules/shared/store/states/accounting/actions/payment-account.actions';
import { getAccountPayments } from '../../../../app/modules/shared/store/states/accounting/selectors/accounting.selectors';
import {
	getActivePaymentAccount,
	getActivePaymentAccountId,
} from '../../../../app/modules/shared/store/states/accounting/selectors/payment-account.selector';
import { IPaymentAccountModel } from '../../../../domain/models/accounting/payment-account.model';
import { IPaymentOperationModel } from '../../../../domain/models/accounting/payment-operation.model';
import { PaymentsHistoryComponent } from '../payments-history/payments-history.component';

@Component({
	selector: 'payments-dashboard',
	templateUrl: './payments-dashboard.component.html',
	styleUrls: ['./payments-dashboard.component.css'],
	changeDetection: ChangeDetectionStrategy.OnPush,
	standalone: true,
	imports: [MatButtonModule, MatProgressBarModule, PaymentsHistoryComponent],
})
export class PaymentsDashboardComponent implements OnInit {
	public paymentAccountGeneralInfoSignal: Signal<string> = signal('');

	@Select(getActivePaymentAccountId)
	public getActivePaymentAccountId$!: Observable<Guid>;

	@Select(getActivePaymentAccount)
	public activePaymentAccount$!: Observable<IPaymentAccountModel>;

	@Select(getAccountPayments)
	public accountPayments$!: Observable<IPaymentOperationModel[]>;

	public activePaymentsAccountSignal: Signal<IPaymentAccountModel | undefined> = toSignal(
		this.activePaymentAccount$,
		{
			initialValue: undefined,
		}
	);

	public accountPaymentsSignal: Signal<IPaymentOperationModel[]> = toSignal(this.accountPayments$, {
		initialValue: [],
	});

	public activePaymentAccountIdSignal: Signal<Guid> = toSignal(this.getActivePaymentAccountId$, {
		initialValue: Guid.EMPTY,
	});

	constructor(
		private readonly route: ActivatedRoute,
		private readonly router: Router,
		private readonly store: Store,
		private readonly accountsTransferService: CrossAccountsTransferService,
		public readonly transferProjectionSynchronizationService: TransferProjectionSynchronizationService
	) {
		this.paymentAccountGeneralInfoSignal = computed(() => {
			const activePaymentAccount = this.activePaymentsAccountSignal();

			if (_.isNil(activePaymentAccount)) {
				return '';
			}

			return `${this.activePaymentAccountIdSignal()?.toString()}
				${activePaymentAccount.emitter} | ${activePaymentAccount.description}`;
		});
	}

	public readonly accountingSummarySignal = computed(() => {
		const operations = this.accountPaymentsSignal();

		const settled = operations.filter(operation => isPast(new Date(operation.operationDate)));
		const scheduled = operations.filter(operation => isFuture(new Date(operation.operationDate)));
		const income = _.sumBy(
			operations.filter(operation => operation.amount > 0),
			operation => operation.amount
		);
		const expense = _.sumBy(
			operations.filter(operation => operation.amount < 0),
			operation => Math.abs(operation.amount)
		);

		return {
			operationsCount: operations.length,
			settledCount: settled.length,
			scheduledCount: scheduled.length,
			income: _.round(income, 2),
			expense: _.round(expense, 2),
			net: _.round(income - expense, 2),
		};
	});

	public ngOnInit(): void {
		if (_.isNil(this.store.selectSnapshot(getActivePaymentAccount))) {
			void this.navigateToPaymentAccountsAsync();
		}
	}

	public async navigateToPaymentAccountsAsync(): Promise<void> {
		this.store.dispatch(new SetActivePaymentAccount(''));
		this.store.dispatch(new SetActiveAccountingOperation(undefined));

		const accountingWorkspaceRoute = this.route.parent?.parent;

		if (_.isNil(accountingWorkspaceRoute)) {
			return;
		}

		await this.router.navigate(
			[
				{
					outlets: {
						primary: null,
						right_sidebar: null,
					},
				},
			],
			{ relativeTo: accountingWorkspaceRoute }
		);
	}

	public moneyTransfer(): void {
		this.accountsTransferService.openForTransfer();
	}
}
