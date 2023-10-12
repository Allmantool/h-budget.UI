import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';

import { Select, Store } from '@ngxs/store';
import { Observable, Subscription, BehaviorSubject } from 'rxjs';
import { Guid } from 'typescript-guid';

import { AccountingGridRecord } from 'presentation/accounting/models/accounting-grid-record';
import { getAccountingRecords } from '../../../../app/modules/shared/store/states/accounting/selectors/accounting.selectors';
import { AddRange } from '../../../../app/modules/shared/store/states/accounting/actions/accounting.actions';
import { SetActiveAccountingOperation } from '../../../../app/modules/shared/store/states/accounting/actions/accounting-table-options.actions';
import { getAccountingTableOptions } from '../../../../app/modules/shared/store/states/accounting/selectors/table-options.selectors';
import { AccountingOperationsTableOptions } from '../../../../app/modules/shared/store/models/accounting/accounting-table-options';
import { getPaymentAccountId } from '../../../../app/modules/shared/store/states/accounting/selectors/payment-account.selector';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
	selector: 'accounting-operarions-grid',
	templateUrl: './accounting-operations-grid.component.html',
	styleUrls: ['./accounting-operations-grid.component.css'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountingOperatiosGridComponent implements OnInit, OnDestroy {
	private subs: Subscription[] = [];

	@Select(getAccountingRecords)
	accountingRecords$!: Observable<AccountingGridRecord[]>;

	@Select(getPaymentAccountId)
	paymentAccountId$!: Observable<string>;

	public ELEMENT_DATA: AccountingGridRecord[] = [
		{
			id: Guid.create(),
			operationDate: new Date(2022, 24, 4),
			contractor: 'Перевозчик: Такси',
			category: 'Транспорт: Такси',
			income: 0,
			expense: 0.35,
			balance: 0.35,
			comment: 'comment',
		},
		{
			id: Guid.create(),
			operationDate: new Date(2022, 28, 4),
			contractor: 'Перевозчик: Такси',
			category: 'Транспорт: Общественный транспорт',
			income: 0,
			expense: 0.35,
			balance: 0.35,
			comment: 'long long comment very long long long',
		},
		{
			id: Guid.create(),
			operationDate: new Date(2022, 29, 4),
			contractor: 'Перевозчик: Такси',
			category: 'Транспорт: Общественный транспорт',
			income: 0,
			expense: 11000.35,
			balance: 1201030.35,
			comment: 'long long comment very long long long',
		},
		{
			id: Guid.create(),
			operationDate: new Date(2022, 5, 5),
			contractor: 'Работа: GodelTech',
			category: 'Доход: Аванс',
			income: 15864,
			expense: 0,
			balance: 1201030.35,
			comment: 'long long comment very long long long',
		},
	];

	public displayedColumns: string[] = [
		'operationDate',
		'contractor',
		'category',
		'income',
		'expense',
		'balance',
		'comment',
	];

	public dataSource$: BehaviorSubject<AccountingGridRecord[]> = new BehaviorSubject<
		AccountingGridRecord[]
	>([]);
	public clickedRowGuids = new Set<Guid>();

	@Select(getAccountingTableOptions)
	accountingTableOptions$!: Observable<AccountingOperationsTableOptions>;

	constructor(
		private readonly route: ActivatedRoute,
		private readonly router: Router,
		private readonly store: Store
	) {
		this.store.dispatch(new AddRange(this.ELEMENT_DATA));
	}
	ngOnInit(): void {
		const tableDataSource$ = this.accountingRecords$.subscribe((records) =>
			this.dataSource$.next(records)
		);

		const tableOptions$ = this.accountingTableOptions$.subscribe((options) => {
			this.clickedRowGuids.clear();
			this.clickedRowGuids.add(options.selectedRecordGuid);
		});

		this.subs.push(tableDataSource$);
		this.subs.push(tableOptions$);
	}

	ngOnDestroy(): void {
		this.subs.forEach((s) => s.unsubscribe());
	}

	public selectRow(record: AccountingGridRecord): void {
		this.store.dispatch(new SetActiveAccountingOperation(record.id));
	}

	public async navigateToPaymentAccountsAsync(): Promise<void> {
		await this.router.navigate(['..'], { relativeTo: this.route });
		/*
		await this.router.navigate(
			[
				{
					outlets: { primary: ['..'], rightSidebar: ['..'] },
				},
			],
			{ relativeTo: this.route }
		);
		*/
	}
}
