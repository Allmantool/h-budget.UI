import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, Signal, signal } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';

import { Select, Store } from '@ngxs/store';
import { combineLatest, Observable, Subject } from 'rxjs';
import { filter, take, takeUntil } from 'rxjs/operators';
import * as _ from 'lodash';
import { nameof } from 'ts-simple-nameof';

import { AccountingGridRecord } from '../../models/accounting-grid-record';
import { OperationCategory } from '../../../../domain/models/accounting/operation-category.model';
import { AccountingOperationsTableOptions } from 'app/modules/shared/store/models/accounting/accounting-table-options';
import { getAccountingTableOptions } from '../../../../app/modules/shared/store/states/accounting/selectors/table-options.selectors';
import { getAccountingRecords } from '../../../../app/modules/shared/store/states/accounting/selectors/accounting.selectors';
import { CategoriesDialogService } from '../../services/categories-dialog.service';
import { getCategories } from '../../../../app/modules/shared/store/states/handbooks/selectors/categories.selectors';
import { getContractors } from '../../../../app/modules/shared/store/states/handbooks/selectors/counterparties.selectors';
import { CounterpartiesDialogService } from '../../services/counterparties-dialog.service';
import '../../../../domain/extensions/handbookExtensions';
import { DefaultContractorsProvider } from '../../../../data/providers/accounting/contractors.provider';
import { SetInitialContractors } from '../../../../app/modules/shared/store/states/handbooks/actions/counterparty.actions';
import { AccountingOperationsService } from '../../services/accounting-operations.service';

@Component({
	selector: 'accounting-crud',
	templateUrl: './accounting-operations-crud.component.html',
	styleUrls: ['./accounting-operations-crud.component.css'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountingOperationsCrudComponent implements OnInit, OnDestroy {
	private destroy$ = new Subject<void>();

	public contractorsSignal: Signal<string[]>;

	public expenseSignal: Signal<string>;

	public selectedRecordSignal: Signal<AccountingGridRecord>;

	public categories: OperationCategory[] = [];

	public crudRecordFg: UntypedFormGroup;

	@Select(getAccountingTableOptions)
	accountingTableOptions$!: Observable<AccountingOperationsTableOptions>;

	@Select(getAccountingRecords)
	accountingRecords$!: Observable<AccountingGridRecord[]>;

	@Select(getCategories)
	categories$!: Observable<OperationCategory[]>;

	@Select(getContractors)
	counterparties$!: Observable<string[]>;

	constructor(
		private readonly accountingOperationsService: AccountingOperationsService,
		private readonly contractorProvider: DefaultContractorsProvider,
		private readonly fb: UntypedFormBuilder,
		private readonly categoriesDialogService: CategoriesDialogService,
		private readonly counterpartiesDialogService: CounterpartiesDialogService,
		private readonly store: Store
	) {
		this.crudRecordFg = this.fb.group({
			id: new UntypedFormControl(),
			operationDate: new UntypedFormControl(),
			contractor: new UntypedFormControl(),
			category: new UntypedFormControl(),
			income: new UntypedFormControl(),
			expense: new UntypedFormControl(),
			comment: new UntypedFormControl(),
		});
		this.selectedRecordSignal = toSignal(this.crudRecordFg.valueChanges, { initialValue: {} });
		this.contractorsSignal = toSignal(this.counterparties$, { initialValue: [] });

		this.expenseSignal = toSignal(
			this.crudRecordFg.get(nameof<AccountingGridRecord>(r => r.expense))!.valueChanges,
			{
				initialValue: '',
			}
		);
	}

	public ngOnDestroy(): void {
		this.destroy$.next();
		this.destroy$.complete();
	}

	public ngOnInit(): void {
		this.contractorProvider
			.getContractors()
			.pipe(take(1), takeUntil(this.destroy$))
			.subscribe(contractors => this.store.dispatch(new SetInitialContractors(contractors)));

		combineLatest([this.accountingTableOptions$, this.accountingRecords$])
			.pipe(
				takeUntil(this.destroy$),
				filter(([tableOptions, records]) => !_.isNil(tableOptions) && !_.isNil(records))
			)
			.subscribe(([tableOptions, records]) => {
				if (!_.isNil(this.crudRecordFg)) {
					const recordData = records.find(r => tableOptions.selectedRecordGuid === r.id)!;

					if (!_.isNil(recordData)) {
						this.crudRecordFg.patchValue({
							id: recordData.id,
							operationDate: recordData.operationDate,
							contractor: recordData.contractor,
							category: recordData.category,
							income: recordData.income,
							expense: recordData.expense,
							comment: recordData.comment,
						});
					}
				}
			});

		this.categories$.pipe(takeUntil(this.destroy$)).subscribe(
			payload =>
				(this.categories = _.map(
					payload,
					i =>
						<OperationCategory>{
							type: i.type,
							value: i.value.parseToTreeAsString(),
						}
				))
		);
	}

	public getCategoryLabels(): string[] {
		return this.categories.map(c => c.value);
	}

	public async applyChangesAsync(): Promise<void> {
		await this.accountingOperationsService.updateOperationAsync(this.selectedRecordSignal());
	}

	public async addRecordAsync(): Promise<void> {
		await this.accountingOperationsService.addOperationAsync();
	}

	public async deleteRecordAsync(): Promise<void> {
		const recordGuid = this.selectedRecordSignal()?.id;

		await this.accountingOperationsService.deleteOperationByGuidAsync(recordGuid);
	}

	public addCategory(): void {
		this.categoriesDialogService.openCategories();
	}

	public addContractor(): void {
		this.counterpartiesDialogService.openCategories();
	}
}
