import { AfterViewInit, ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, Signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';

import * as _ from 'lodash';

import { Select, Store } from '@ngxs/store';
import { BehaviorSubject, forkJoin, Observable, of } from 'rxjs';
import { exhaustMap } from 'rxjs/operators';
import { Guid } from 'typescript-guid';

import { IAccountingOperationsTableOptions } from '../../../../app/modules/shared/store/models/accounting/accounting-table-options';
import { SetActiveAccountingOperation } from '../../../../app/modules/shared/store/states/accounting/actions/accounting-table-options.actions';
import { getAccountPayments } from '../../../../app/modules/shared/store/states/accounting/selectors/accounting.selectors';
import { getActivePaymentAccountId } from '../../../../app/modules/shared/store/states/accounting/selectors/payment-account.selector';
import { getAccountingTableOptions } from '../../../../app/modules/shared/store/states/accounting/selectors/table-options.selectors';
import { IPaymentOperationModel } from '../../../../domain/models/accounting/payment-operation.model';
import { IPaymentRepresentationModel } from '../../models/operation-record';
import { AccountsService } from '../../services/accounts.service';
import { HandbooksService } from '../../services/handbooks.service';
import { PaymentsHistoryService } from '../../services/payments-history.service';

@Component({
	selector: 'payments-history',
	templateUrl: './payments-history.component.html',
	styleUrls: ['./payments-history.component.css'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentsHistoryComponent implements OnInit, AfterViewInit {
	private readonly destroyRef = inject(DestroyRef);

	@Select(getAccountPayments)
	public accountPayments$!: Observable<IPaymentOperationModel[]>;

	@Select(getActivePaymentAccountId)
	public getActivePaymentAccountId$!: Observable<Guid>;

	@Select(getAccountingTableOptions)
	public accountingTableOptions$!: Observable<IAccountingOperationsTableOptions>;

	public activePaymentAccountIdSignal: Signal<Guid> = toSignal(this.getActivePaymentAccountId$, {
		initialValue: Guid.EMPTY,
	});

	public displayedColumns: string[] = [
		'operationDate',
		'contractor',
		'category',
		'income',
		'expense',
		'balance',
		'comment',
	];

	public dataSource$: BehaviorSubject<IPaymentRepresentationModel[]> = new BehaviorSubject<
		IPaymentRepresentationModel[]
	>([]);

	public clickedRowGuids = new Set<Guid>();

	constructor(
		private readonly handbooksService: HandbooksService,
		private readonly paymentsHistoryService: PaymentsHistoryService,
		private readonly accountsService: AccountsService,
		private readonly store: Store
	) {}

	public ngOnInit(): void {
		this.handbooksService.setupHandbooksStore();

		this.accountingTableOptions$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(options => {
			this.clickedRowGuids.clear();
			this.clickedRowGuids.add(options?.selectedRecordGuid);
		});
	}

	public ngAfterViewInit(): void {
		this.accountPayments$
			.pipe(
				takeUntilDestroyed(this.destroyRef),
				exhaustMap(() =>
					forkJoin({
						payments: this.paymentsHistoryService.refreshPaymentsHistory(
							this.activePaymentAccountIdSignal()
						),
						balance: of(this.accountsService.refreshAccounts(this.activePaymentAccountIdSignal())),
					})
				)
			)
			.subscribe(payload => this.dataSource$.next(payload.payments));
	}

	public selectRow(record: IPaymentRepresentationModel): void {
		this.store.dispatch(new SetActiveAccountingOperation(record.key));
	}

	public isFuturePayment = (record: IPaymentRepresentationModel): boolean => record.operationDate > new Date();
}
