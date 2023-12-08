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
import { BehaviorSubject, combineLatest, Observable, zip } from 'rxjs';
import { filter, map, switchMap, take } from 'rxjs/operators';
import { Guid } from 'typescript-guid';

import { IAccountingOperationsTableOptions } from '../../../../app/modules/shared/store/models/accounting/accounting-table-options';
import { SetActiveAccountingOperation } from '../../../../app/modules/shared/store/states/accounting/actions/accounting-table-options.actions';
import { SetInitialPaymentOperations } from '../../../../app/modules/shared/store/states/accounting/actions/payment-operation.actions';
import { getAccountingRecords } from '../../../../app/modules/shared/store/states/accounting/selectors/accounting.selectors';
import {
	getActivePaymentAccount,
	getActivePaymentAccountId,
} from '../../../../app/modules/shared/store/states/accounting/selectors/payment-account.selector';
import { getAccountingTableOptions } from '../../../../app/modules/shared/store/states/accounting/selectors/table-options.selectors';
import { getCategories } from '../../../../app/modules/shared/store/states/handbooks/selectors/categories.selectors';
import { getContractors } from '../../../../app/modules/shared/store/states/handbooks/selectors/counterparties.selectors';
import { PaymentOperationsProvider } from '../../../../data/providers/accounting/payment-operations.provider';
import { ICategoryModel } from '../../../../domain/models/accounting/category.model';
import { IContractorModel } from '../../../../domain/models/accounting/contractor.model.';
import { OperationTypes } from '../../../../domain/models/accounting/operation-types';
import { IPaymentAccountModel } from '../../../../domain/models/accounting/payment-account.model';
import { IAccountingGridRecord } from '../../models/accounting-grid-record';

@Component({
	selector: 'accounting-operarions-grid',
	templateUrl: './accounting-operations-grid.component.html',
	styleUrls: ['./accounting-operations-grid.component.css'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountingOperatiosGridComponent implements OnInit {
	private readonly destroyRef = inject(DestroyRef);

	@Select(getCategories)
	categories$!: Observable<ICategoryModel[]>;

	@Select(getContractors)
	contractors$!: Observable<IContractorModel[]>;

	@Select(getAccountingRecords)
	accountingRecords$!: Observable<IAccountingGridRecord[]>;

	@Select(getActivePaymentAccountId)
	paymentAccountId$!: Observable<string>;

	@Select(getActivePaymentAccount)
	paymentAccound$!: Observable<IPaymentAccountModel>;

	@Select(getAccountingTableOptions)
	accountingTableOptions$!: Observable<IAccountingOperationsTableOptions>;

	public paymentAccountSignal: Signal<IPaymentAccountModel> = toSignal(this.paymentAccound$, {
		initialValue: {} as IPaymentAccountModel,
	});

	public contractorsSignal: Signal<IContractorModel[]>;

	public categoriesSignal: Signal<ICategoryModel[]> = toSignal(this.categories$, {
		initialValue: {} as ICategoryModel[],
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

	public dataSource$: BehaviorSubject<IAccountingGridRecord[]> = new BehaviorSubject<IAccountingGridRecord[]>([]);
	public clickedRowGuids = new Set<Guid>();

	constructor(
		private readonly paymentOperationsService: PaymentOperationsProvider,
		private readonly router: Router,
		private readonly store: Store
	) {
		this.contractorsSignal = toSignal(this.contractors$, {
			initialValue: {} as IContractorModel[],
		});

		if (_.isNil(this.paymentAccountSignal())) {
			this.navigateToPaymentAccountsAsync();
			return;
		}

		this.paymentAccountGeneralInfoSignal = computed(
			() =>
				`${this.paymentAccountSignal()?.key?.toString()} ${this.paymentAccountSignal().emitter} | ${
					this.paymentAccountSignal().description
				}`
		);

		const getPaymentAccountOperations$ = this.paymentOperationsService.getOperationsForPaymentAccount(
			this.paymentAccountSignal().key!.toString()
		);

		combineLatest([this.categories$, this.contractors$, this.paymentAccound$])
			.pipe(
				filter(([categ, contr]) => !_.isEmpty(categ) && !_.isEmpty(contr)),
				switchMap(([categories, contractors, paymentAccount]) =>
					getPaymentAccountOperations$.pipe(
						take(1),
						map(operations =>
							_.map(operations, function (op, operationIndex) {
								const targetContractor = _.find(contractors, c => c.key.equals(op.contractorId));
								const targetCategories = _.find(categories, c => c.key.equals(op.categoryId));

								const isIncome = targetCategories?.operationType === OperationTypes.Income;

								const accumulatedValue = _.sumBy(
									_.slice(operations, 0, operationIndex + 1),
									function (operation) {
										return _.find(categories, c => c.key.equals(operation.categoryId))
											?.operationType === OperationTypes.Income
											? operation.amount
											: -operation.amount;
									}
								);

								return {
									id: op.key,
									operationDate: op.operationDate,
									contractor: targetContractor!.nameNodes.parseToTreeAsString(),
									category: targetCategories!.nameNodes.parseToTreeAsString(),
									comment: op.comment,
									income: isIncome ? op.amount : 0,
									expense: isIncome ? 0 : -op.amount,
									balance: paymentAccount.balance + accumulatedValue,
								} as IAccountingGridRecord;
							})
						)
					)
				)
			)
			.subscribe(gridRecords => this.store.dispatch(new SetInitialPaymentOperations(gridRecords)));
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

	public selectRow(record: IAccountingGridRecord): void {
		this.store.dispatch(new SetActiveAccountingOperation(record.id));
	}

	public async navigateToPaymentAccountsAsync(): Promise<void> {
		await this.router.navigate(['/dashboard/accounting'], { relativeTo: null });
	}
}
