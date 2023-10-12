import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup } from '@angular/forms';

import { Select, Store } from '@ngxs/store';
import { combineLatest, Observable, BehaviorSubject, Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import * as _ from 'lodash';
import { Guid } from 'typescript-guid';

import { AccountingGridRecord } from '../../models/accounting-grid-record';
import { OperationCategory } from '../../../../domain/models/accounting/operation-category';
import { AccountingOperationsTableOptions } from 'app/modules/shared/store/models/accounting/accounting-table-options';
import { OperationTypes } from '../../../../domain/models/accounting/operation-types';
import { getAccountingTableOptions } from '../../../../app/modules/shared/store/states/accounting/selectors/table-options.selectors';
import { getAccountingRecords } from '../../../../app/modules/shared/store/states/accounting/selectors/accounting.selectors';
import { SetActiveAccountingOperation } from '../../../../app/modules/shared/store/states/accounting/actions/accounting-table-options.actions';
import { CategoriesDialogService } from '../../../currency-rates/services/categories-dialog.service';
import {
	Edit,
	Add,
	Delete,
} from '../../../../app/modules/shared/store/states/accounting/actions/accounting.actions';
import { getCategories } from '../../../../app/modules/shared/store/states/handbooks/selectors/categories.selectors';
import { getContractors } from '../../../../app/modules/shared/store/states/handbooks/selectors/counterparties.selectors';
import { CounterpartiesDialogService } from '../../../currency-rates/services/counterparties-dialog.service';
import '../../../../domain/extensions/handbookExtensions';

@Component({
	selector: 'accounting-crud',
	templateUrl: './accounting-operations-crud.component.html',
	styleUrls: ['./accounting-operations-crud.component.css'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountingOperationsCrudComponent implements OnInit, OnDestroy {
	private destroy$ = new Subject<void>();

	public contractors: string[] = [];

	public categories: OperationCategory[] = [];

	public selectedRecord$ = new BehaviorSubject<AccountingGridRecord | undefined>(undefined);

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
	}

	ngOnDestroy(): void {
		this.destroy$.next();
		this.destroy$.complete();
	}

	ngOnInit(): void {
		combineLatest([this.accountingTableOptions$, this.accountingRecords$])
			.pipe(
				takeUntil(this.destroy$),
				filter(([tableOptions, records]) => !_.isNil(tableOptions) && !_.isNil(records))
			)
			.subscribe(([tableOptions, records]) => {
				this.selectedRecord$.next(
					records.find((r) => tableOptions.selectedRecordGuid === r.id)
				);

				if (!_.isNil(this.crudRecordFg) && !_.isNil(this.selectedRecord$.value)) {
					const recordData = this.selectedRecord$.value;

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
			});

		this.crudRecordFg.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((formData) => {
			this.selectedRecord$.next(formData as AccountingGridRecord);
		});

		this.categories$.pipe(takeUntil(this.destroy$)).subscribe(
			(payload) =>
				(this.categories = _.map(
					payload,
					(i) =>
						<OperationCategory>{
							type: i.type,
							value: i.value.parseToTreeAsString(),
						}
				))
		);

		this.counterparties$
			.pipe(takeUntil(this.destroy$))
			.subscribe(
				(payload) => (this.contractors = _.map(payload, (i) => i.parseToTreeAsString()))
			);
	}

	public isExpenseOperation(): boolean {
		const selectedCategoryValue: string =
			(this.crudRecordFg.controls['category']?.value as string) ||
			(this.selectedRecord$?.value?.category as string);

		const selectedCategory = _.find(this.categories, (c) => c.value === selectedCategoryValue);

		return selectedCategory?.type === OperationTypes.Expense;
	}

	public getCategoryLabels(): string[] {
		return this.categories.map((c) => c.value);
	}

	public getContractorLabels(): string[] {
		return this.contractors;
	}

	public saveRecord(): void {
		if (!_.isNil(this.selectedRecord$.value)) {
			this.store.dispatch(new Edit(this.selectedRecord$.value));
		}
	}

	public addRecord(): void {
		const newRecord = {
			id: Guid.create(),
			operationDate: new Date(),
			contractor: '',
			category: '',
			income: 0,
			expense: 0,
			balance: 0,
			comment: '',
		} as AccountingGridRecord;

		this.store.dispatch(new Add(newRecord));

		this.selectedRecord$.next(newRecord);

		this.store.dispatch(new SetActiveAccountingOperation(newRecord.id));
	}

	public deleteRecord(): void {
		console.log(this.selectedRecord$.value);

		const recordGuid = this.selectedRecord$.value?.id;

		if (_.isNil(recordGuid)) {
			return;
		}

		this.store.dispatch(new Delete(recordGuid));
	}

	public addCategory(): void {
		this.categoriesDialogService.openCategories();
	}

	public addContractor(): void {
		this.counterpartiesDialogService.openCategories();
	}
}
