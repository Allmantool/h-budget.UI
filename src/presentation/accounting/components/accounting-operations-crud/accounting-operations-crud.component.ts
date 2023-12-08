import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, OnInit, Signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup } from '@angular/forms';

import * as _ from 'lodash';

import { Select, Store } from '@ngxs/store';
import { combineLatest, Observable } from 'rxjs';
import { filter, take } from 'rxjs/operators';
import { nameof } from 'ts-simple-nameof';
import { Guid } from 'typescript-guid';

import { IAccountingOperationsTableOptions } from 'app/modules/shared/store/models/accounting/accounting-table-options';

import { getAccountingRecords } from '../../../../app/modules/shared/store/states/accounting/selectors/accounting.selectors';
import { getAccountingTableOptions } from '../../../../app/modules/shared/store/states/accounting/selectors/table-options.selectors';
import { SetInitialCategories } from '../../../../app/modules/shared/store/states/handbooks/actions/category.actions';
import { SetInitialContractors } from '../../../../app/modules/shared/store/states/handbooks/actions/counterparty.actions';
import {
	getCategoryAsNodesMap,
	getCategoryNodes,
} from '../../../../app/modules/shared/store/states/handbooks/selectors/categories.selectors';
import { getContractorNodes } from '../../../../app/modules/shared/store/states/handbooks/selectors/counterparties.selectors';
import { DefaultCategoriesProvider } from '../../../../data/providers/accounting/categories.provider';
import { DefaultContractorsProvider } from '../../../../data/providers/accounting/contractors.provider';
import { ICategoryModel } from '../../../../domain/models/accounting/category.model';
import { OperationTypes } from '../../../../domain/models/accounting/operation-types';
import { IAccountingGridRecord } from '../../models/accounting-grid-record';
import { AccountingOperationsService } from '../../services/accounting-operations.service';
import { CategoriesDialogService } from '../../services/categories-dialog.service';
import { CounterpartiesDialogService } from '../../services/counterparties-dialog.service';
import '../../../../domain/extensions/handbookExtensions';

@Component({
	selector: 'accounting-crud',
	templateUrl: './accounting-operations-crud.component.html',
	styleUrls: ['./accounting-operations-crud.component.css'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountingOperationsCrudComponent implements OnInit {
	private readonly destroyRef = inject(DestroyRef);

	public contractorsSignal: Signal<string[]>;

	public categoryNodesSignal: Signal<string[]>;

	public categoriesMapSignal: Signal<Map<string, ICategoryModel>>;

	public selectedCategorySignal: Signal<string>;

	public selectedContractorSignal: Signal<string>;

	public isExpenseSignal: Signal<boolean>;

	public selectedRecordSignal: Signal<IAccountingGridRecord>;

	public accountingRecordsSignal: Signal<IAccountingGridRecord[]>;

	public crudRecordFg: UntypedFormGroup;

	@Select(getAccountingTableOptions)
	accountingTableOptions$!: Observable<IAccountingOperationsTableOptions>;

	@Select(getAccountingRecords)
	accountingRecords$!: Observable<IAccountingGridRecord[]>;

	@Select(getCategoryNodes)
	categoryNodes$!: Observable<string[]>;

	@Select(getCategoryAsNodesMap)
	categoriesMap$!: Observable<Map<string, ICategoryModel>>;

	@Select(getContractorNodes)
	counterparties$!: Observable<string[]>;

	constructor(
		private readonly accountingOperationsService: AccountingOperationsService,
		private readonly contractorsProvider: DefaultContractorsProvider,
		private readonly categoriesProvider: DefaultCategoriesProvider,
		private readonly fb: UntypedFormBuilder,
		private readonly categoriesDialogService: CategoriesDialogService,
		private readonly counterpartiesDialogService: CounterpartiesDialogService,
		private readonly store: Store
	) {
		this.accountingRecordsSignal = toSignal(this.accountingRecords$, { initialValue: [] });

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
		this.categoryNodesSignal = toSignal(this.categoryNodes$, { initialValue: [] });
		this.categoriesMapSignal = toSignal(this.categoriesMap$, { initialValue: new Map<string, ICategoryModel>() });
		this.selectedCategorySignal = toSignal(
			this.crudRecordFg.get(nameof<IAccountingGridRecord>(r => r.category))!.valueChanges,
			{ initialValue: '' }
		);
		this.selectedContractorSignal = toSignal(
			this.crudRecordFg.get(nameof<IAccountingGridRecord>(r => r.contractor))!.valueChanges,
			{ initialValue: '' }
		);

		this.isExpenseSignal = computed(() => {
			const selectedCategory = this.categoriesMapSignal().get(this.selectedCategorySignal());

			return selectedCategory?.operationType == OperationTypes.Expense;
		});
	}

	public ngOnInit(): void {
		this.contractorsProvider
			.getContractors()
			.pipe(take(1), takeUntilDestroyed(this.destroyRef))
			.subscribe(contractors => this.store.dispatch(new SetInitialContractors(contractors)));

		this.categoriesProvider
			.getCategoriries()
			.pipe(take(1), takeUntilDestroyed(this.destroyRef))
			.subscribe(categories => this.store.dispatch(new SetInitialCategories(categories)));

		combineLatest([this.accountingTableOptions$, this.accountingRecords$])
			.pipe(
				takeUntilDestroyed(this.destroyRef),
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
	}

	public async applyChangesAsync(): Promise<void> {
		await this.accountingOperationsService.updateOperationAsync(this.selectedRecordSignal());
	}

	public async addRecordAsync(): Promise<void> {
		const records = this.accountingRecordsSignal();

		if (!_.isEmpty(records) && _.some(records, { id: Guid.EMPTY })) {
			return;
		}

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
