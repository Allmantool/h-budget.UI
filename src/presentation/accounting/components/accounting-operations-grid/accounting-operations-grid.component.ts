import {
	ChangeDetectionStrategy,
	Component,
	computed,
	DestroyRef,
	inject,
	OnInit,
	signal,
	Signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';

import * as _ from 'lodash';

import { Select, Store } from '@ngxs/store';
import { BehaviorSubject, Observable, retry } from 'rxjs';
import { take } from 'rxjs/operators';

import { Guid } from 'typescript-guid';

import { AccountingOperationsTableOptions } from '../../../../app/modules/shared/store/models/accounting/accounting-table-options';
import { SetActiveAccountingOperation } from '../../../../app/modules/shared/store/states/accounting/actions/accounting-table-options.actions';
import { SetInitialPaymentOperations } from '../../../../app/modules/shared/store/states/accounting/actions/payment-operation.actions';
import { getAccountingRecords } from '../../../../app/modules/shared/store/states/accounting/selectors/accounting.selectors';
import {
	getActivePaymentAccount,
	getActivePaymentAccountId,
} from '../../../../app/modules/shared/store/states/accounting/selectors/payment-account.selector';
import { getAccountingTableOptions } from '../../../../app/modules/shared/store/states/accounting/selectors/table-options.selectors';
import { PaymentOperationsProvider } from '../../../../data/providers/accounting/payment-operations.provider';
import { PaymentAccountModel } from '../../../../domain/models/accounting/payment-account.model';
import { AccountingGridRecord } from '../../models/accounting-grid-record';

@Component({
	selector: 'accounting-operarions-grid',
	templateUrl: './accounting-operations-grid.component.html',
	styleUrls: ['./accounting-operations-grid.component.css'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountingOperatiosGridComponent implements OnInit {
	private readonly destroyRef = inject(DestroyRef);

	@Select(getAccountingRecords)
	accountingRecords$!: Observable<AccountingGridRecord[]>;

	@Select(getActivePaymentAccountId)
	paymentAccountId$!: Observable<string>;

	@Select(getActivePaymentAccount)
	paymentAccound$!: Observable<PaymentAccountModel>;

	public paymentAccountSignal: Signal<PaymentAccountModel> = toSignal(this.paymentAccound$, {
		initialValue: {} as PaymentAccountModel,
	});

	public paymentAccountGeneralInfoSignal: Signal<string> = signal('');

	public displayedColumns: string[] = [
		'operationDate',
		'contractor',
		'category',
		'income',
		'expense',
		'balance',
		'comment',
	];

	public dataSource$: BehaviorSubject<AccountingGridRecord[]> = new BehaviorSubject<AccountingGridRecord[]>([]);
	public clickedRowGuids = new Set<Guid>();

	@Select(getAccountingTableOptions)
	accountingTableOptions$!: Observable<AccountingOperationsTableOptions>;

	constructor(
		private readonly paymentOperationsService: PaymentOperationsProvider,
		private readonly router: Router,
		private readonly store: Store
	) {
		if (!_.isNil(this.paymentAccountSignal())) {
			this.paymentAccountGeneralInfoSignal = computed(
				() =>
					`${this.paymentAccountSignal()?.key?.toString()} ${this.paymentAccountSignal().emitter} | ${
						this.paymentAccountSignal().description
					}`
			);
			this.paymentOperationsService
				.getOperationsForPaymentAccount(this.paymentAccountSignal().key!.toString())
				.pipe(retry(1), take(1))
				.subscribe(operations => {
					const gridRecords: AccountingGridRecord[] = _.map(operations, function (op) {
						return {
							id: op.key,
							operationDate: op.operationDate,
							contractor: op.contractorId.toString(),
							category: op.categoryId.toString(),
							comment: op.comment,
							income: op.amount,
							expense: op.amount,
							balance: op.amount,
						} as AccountingGridRecord;
					});

					this.store.dispatch(new SetInitialPaymentOperations(gridRecords));
				});
		}
	}

	public ngOnInit(): void {
		this.accountingRecords$
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe(records => this.dataSource$.next(records));

		this.accountingTableOptions$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(options => {
			this.clickedRowGuids.clear();
			this.clickedRowGuids.add(options.selectedRecordGuid);
		});
	}

	public selectRow(record: AccountingGridRecord): void {
		this.store.dispatch(new SetActiveAccountingOperation(record.id));
	}

	public async navigateToPaymentAccountsAsync(): Promise<void> {
		await this.router.navigate(['/dashboard/accounting'], { relativeTo: null });
	}
}
