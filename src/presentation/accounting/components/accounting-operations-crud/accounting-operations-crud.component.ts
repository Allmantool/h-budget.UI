import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, Signal, inject } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';

import { Select, Store } from '@ngxs/store';
import { Observable, combineLatest } from 'rxjs';
import { filter, take } from 'rxjs/operators';
import * as _ from 'lodash';
import { nameof } from 'ts-simple-nameof';

import { AccountingGridRecord } from '../../models/accounting-grid-record';
import { CategoryModel } from '../../../../domain/models/accounting/category.model';
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
import { DefaultCategoriesProvider } from '../../../../data/providers/accounting/categories.provider';
import { SetInitialCategories } from '../../../../app/modules/shared/store/states/handbooks/actions/category.actions';

@Component({
	selector: 'accounting-crud',
	templateUrl: './accounting-operations-crud.component.html',
	styleUrls: ['./accounting-operations-crud.component.css'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountingOperationsCrudComponent implements OnInit {
	private readonly destroyRef = inject(DestroyRef);

	public contractorsSignal: Signal<string[]>;

	public categoriesSignal: Signal<string[]>;

	public expenseSignal: Signal<string>;

	public selectedRecordSignal: Signal<AccountingGridRecord>;

	public categories: CategoryModel[] = [];

	public crudRecordFg: UntypedFormGroup;

	@Select(getAccountingTableOptions)
	accountingTableOptions$!: Observable<AccountingOperationsTableOptions>;

	@Select(getAccountingRecords)
	accountingRecords$!: Observable<AccountingGridRecord[]>;

	@Select(getCategories)
	categories$!: Observable<string[]>;

	@Select(getContractors)
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
		this.categoriesSignal = toSignal(this.categories$, { initialValue: [] });

		this.expenseSignal = toSignal(
			this.crudRecordFg.get(nameof<AccountingGridRecord>(r => r.expense))!.valueChanges,
			{
				initialValue: '',
			}
		);
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

	public getCategoryLabels(): string[] {
		return this.categories.map(c => c.nameNodes.toString());
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
