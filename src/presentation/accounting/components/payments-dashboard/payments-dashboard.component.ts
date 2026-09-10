import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal, Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { CrossAccountsTransferService } from 'presentation/accounting/services/cross-accounts-transfer.dialog.service';
import { PaymentCommandExecutorService } from 'presentation/accounting/services/payment-command-executor.service';
import { PaymentEditorLeaveService } from 'presentation/accounting/services/payment-editor-leave.service';
import { TransferProjectionSynchronizationService } from 'presentation/accounting/services/transfer-projection-synchronization.service';

import _ from 'lodash';

import { Select, Store } from '@ngxs/store';
import { isFuture, isPast } from 'date-fns';
import { Observable, take } from 'rxjs';
import { Guid } from 'typescript-guid';

import { SetActiveAccountingOperation } from '../../../../app/modules/shared/store/states/accounting/actions/accounting-table-options.actions';
import {
	AddPaymentAccount,
	SetActivePaymentAccount,
} from '../../../../app/modules/shared/store/states/accounting/actions/payment-account.actions';
import { getAccountPayments } from '../../../../app/modules/shared/store/states/accounting/selectors/accounting.selectors';
import {
	getActivePaymentAccount,
	getActivePaymentAccountId,
} from '../../../../app/modules/shared/store/states/accounting/selectors/payment-account.selector';
import { getCategories } from '../../../../app/modules/shared/store/states/handbooks/selectors/categories.selectors';
import { DefaultPaymentAccountsProvider } from '../../../../data/providers/accounting/payment-accounts.provider';
import { calculatePaymentOperationIncrement } from '../../../../domain/models/accounting/calculate-payment-operation-increment';
import { ICategoryModel } from '../../../../domain/models/accounting/category.model';
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
	private readonly paymentCommandExecutor = inject(PaymentCommandExecutorService, { optional: true });
	public paymentAccountGeneralInfoSignal: Signal<string> = signal('');

	@Select(getActivePaymentAccountId)
	public getActivePaymentAccountId$!: Observable<Guid>;

	@Select(getActivePaymentAccount)
	public activePaymentAccount$!: Observable<IPaymentAccountModel>;

	@Select(getAccountPayments)
	public accountPayments$!: Observable<IPaymentOperationModel[]>;

	@Select(getCategories)
	public categories$!: Observable<ICategoryModel[]>;

	public activePaymentsAccountSignal: Signal<IPaymentAccountModel | undefined> = toSignal(
		this.activePaymentAccount$,
		{
			initialValue: undefined,
		}
	);

	public accountPaymentsSignal: Signal<IPaymentOperationModel[]> = toSignal(this.accountPayments$, {
		initialValue: [],
	});

	public categoriesSignal: Signal<ICategoryModel[]> = toSignal(this.categories$, {
		initialValue: [],
	});

	public activePaymentAccountIdSignal: Signal<Guid> = toSignal(this.getActivePaymentAccountId$, {
		initialValue: Guid.EMPTY,
	});

	constructor(
		private readonly route: ActivatedRoute,
		private readonly router: Router,
		private readonly store: Store,
		private readonly paymentAccountsProvider: DefaultPaymentAccountsProvider,
		private readonly accountsTransferService: CrossAccountsTransferService,
		private readonly paymentEditorLeaveService: PaymentEditorLeaveService,
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
		const categories = this.categoriesSignal();
		const increments = operations.map(operation =>
			calculatePaymentOperationIncrement(
				operation,
				categories.find(category => category.key.equals(operation.categoryId))
			)
		);

		const settled = operations.filter(operation => isPast(new Date(operation.operationDate)));
		const scheduled = operations.filter(operation => isFuture(new Date(operation.operationDate)));
		const income = _.sum(increments.filter(increment => increment > 0));
		const expense = _.sum(increments.filter(increment => increment < 0).map(Math.abs));
		const net = _.sum(increments);

		return {
			operationsCount: operations.length,
			settledCount: settled.length,
			scheduledCount: scheduled.length,
			income: _.round(income, 2),
			expense: _.round(expense, 2),
			net: _.round(net, 2),
		};
	});

	public ngOnInit(): void {
		void this.paymentCommandExecutor?.recoverPendingCommands();
		if (_.isNil(this.store.selectSnapshot(getActivePaymentAccount))) {
			this.restoreActivePaymentAccountFromRoute();
		}
	}

	private restoreActivePaymentAccountFromRoute(): void {
		const paymentAccountId = this.route.snapshot.queryParamMap.get('paymentAccountId');

		if (_.isNil(paymentAccountId)) {
			void this.navigateToPaymentAccountsAsync();
			return;
		}

		this.paymentAccountsProvider
			.getById(paymentAccountId)
			.pipe(take(1))
			.subscribe({
				next: paymentAccount => {
					this.store.dispatch([
						new AddPaymentAccount(paymentAccount),
						new SetActivePaymentAccount(paymentAccountId),
					]);
				},
				error: () => void this.navigateToPaymentAccountsAsync(),
			});
	}

	public async navigateToPaymentAccountsAsync(): Promise<void> {
		if (!(await this.paymentEditorLeaveService.canLeave())) {
			return;
		}

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
