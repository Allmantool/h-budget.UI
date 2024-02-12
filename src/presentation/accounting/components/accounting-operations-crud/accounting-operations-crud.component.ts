import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, OnInit, Signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup } from '@angular/forms';

import * as _ from 'lodash';

import { Select } from '@ngxs/store';
import { combineLatest, Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { Guid } from 'typescript-guid';

import { IAccountingOperationsTableOptions } from '../../../../app/modules/shared/store/models/accounting/accounting-table-options';
import { getAccountPayments } from '../../../../app/modules/shared/store/states/accounting/selectors/accounting.selectors';
import { getActivePaymentAccountId } from '../../../../app/modules/shared/store/states/accounting/selectors/payment-account.selector';
import {
	getAccountingTableOptions,
	getSelectedRecordGuid,
} from '../../../../app/modules/shared/store/states/accounting/selectors/table-options.selectors';
import {
	getCategoryAsNodesMap,
	getCategoryNodes,
} from '../../../../app/modules/shared/store/states/handbooks/selectors/categories.selectors';
import { ICategoryModel } from '../../../../domain/models/accounting/category.model';
import { IContractorModel } from '../../../../domain/models/accounting/contractor.model.';
import { OperationTypes } from '../../../../domain/models/accounting/operation-types';
import { IPaymentOperationModel } from '../../../../domain/models/accounting/payment-operation.model';
import { IPaymentRepresentationModel } from '../../models/operation-record';
import { AccountingOperationsService } from '../../services/accounting-operations.service';
import { CategoriesDialogService } from '../../services/categories-dialog.service';
import { PaymentsHistoryService } from '../../services/payments-history.service';
import '../../../../domain/extensions/handbookExtensions';
import { ContractorsDialogService } from '../../services/contractors-dialog.service';
import {
	getContractorAsNodesMap,
	getContractorNodes,
} from '../../../../app/modules/shared/store/states/handbooks/selectors/counterparties.selectors';

@Component({
	selector: 'accounting-crud',
	templateUrl: './accounting-operations-crud.component.html',
	styleUrls: ['./accounting-operations-crud.component.css'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountingOperationsCrudComponent implements OnInit {
	private readonly destroyRef = inject(DestroyRef);

	public crudRecordFg: UntypedFormGroup;

	@Select(getActivePaymentAccountId)
	public getActivePaymentAccountId$!: Observable<Guid | undefined>;

	@Select(getAccountingTableOptions)
	accountingTableOptions$!: Observable<IAccountingOperationsTableOptions>;

	@Select(getAccountPayments)
	accountingRecords$!: Observable<IPaymentOperationModel[]>;

	@Select(getCategoryNodes)
	categoryNodes$!: Observable<string[]>;

	@Select(getCategoryAsNodesMap)
	categoriesMap$!: Observable<Map<string, ICategoryModel>>;

	@Select(getContractorAsNodesMap)
	contractorsMap$!: Observable<Map<string, IContractorModel>>;

	@Select(getContractorNodes)
	contractors$!: Observable<string[]>;

	@Select(getSelectedRecordGuid)
	selectedRecordGuid$!: Observable<Guid>;

	public selectedRecordGuidSignal: Signal<Guid | null>;
	public isNotReadyForSaveSignal: Signal<boolean>;
	public contractorsSignal: Signal<string[]>;
	public categoryNodesSignal: Signal<string[]>;
	public categoriesMapSignal: Signal<Map<string, ICategoryModel>>;
	public contractorsMapSignal: Signal<Map<string, IContractorModel>>;
	public selectedCategorySignal: Signal<string>;
	public selectedContractorSignal: Signal<string>;
	public isExpenseSignal: Signal<boolean>;
	public selectedPaymentSignal: Signal<IPaymentOperationModel>;
	public accountingRecordsSignal: Signal<IPaymentOperationModel[]>;
	public activePaymentAccountIdSignal: Signal<Guid | undefined> = toSignal(this.getActivePaymentAccountId$, {
		initialValue: undefined,
	});

	constructor(
		private readonly fb: UntypedFormBuilder,
		private readonly accountingOperationsService: AccountingOperationsService,
		private readonly categoriesDialogService: CategoriesDialogService,
		private readonly contractorsDialogService: ContractorsDialogService,
		private readonly paymentHistoryService: PaymentsHistoryService
	) {
		this.accountingRecordsSignal = toSignal(this.accountingRecords$, { initialValue: [] });

		this.selectedRecordGuidSignal = toSignal(this.selectedRecordGuid$, { initialValue: null });

		this.isNotReadyForSaveSignal = computed(
			() => _.isEmpty(this.accountingRecordsSignal()) || _.isNil(this.selectedRecordGuidSignal())
		);

		this.crudRecordFg = this.fb.group({
			key: new UntypedFormControl(),
			operationDate: new UntypedFormControl({ disabled: true }),
			contractor: new UntypedFormControl({ disabled: true }),
			category: new UntypedFormControl({ disabled: true }),
			income: new UntypedFormControl({ disabled: true }),
			expense: new UntypedFormControl({ disabled: true }),
			comment: new UntypedFormControl({ disabled: true }),
		});

		this.contractorsSignal = toSignal(this.contractors$, { initialValue: [] });
		this.categoryNodesSignal = toSignal(this.categoryNodes$, { initialValue: [] });
		this.categoriesMapSignal = toSignal(this.categoriesMap$, { initialValue: new Map<string, ICategoryModel>() });
		this.contractorsMapSignal = toSignal(this.contractorsMap$, {
			initialValue: new Map<string, IContractorModel>(),
		});
		this.selectedCategorySignal = toSignal(this.crudRecordFg.get('category')!.valueChanges, { initialValue: '' });
		this.selectedContractorSignal = toSignal(this.crudRecordFg.get('contractor')!.valueChanges, {
			initialValue: '',
		});

		this.isExpenseSignal = computed(() => {
			const selectedCategory = this.categoriesMapSignal().get(this.selectedCategorySignal());

			return selectedCategory?.operationType == OperationTypes.Expense;
		});

		const formsCrudSignal = toSignal<IPaymentRepresentationModel>(this.crudRecordFg.valueChanges, {
			initialValue: null,
		});

		this.selectedPaymentSignal = computed(() => {
			const payment = formsCrudSignal();
			const category = this.categoriesMapSignal().get(payment?.category ?? '');
			const contractor = this.contractorsMapSignal().get(payment?.contractor ?? '');

			return {
				key: payment?.key,
				paymentAccountId: this.activePaymentAccountIdSignal(),
				operationDate: payment?.operationDate,
				amount: category?.operationType == OperationTypes.Expense ? payment?.expense : payment?.income,
				categoryId: category?.key,
				contractorId: contractor?.key,
				comment: payment?.comment,
			} as IPaymentOperationModel;
		});
	}

	public ngOnInit(): void {
		combineLatest([this.accountingTableOptions$, this.accountingRecords$])
			.pipe(
				takeUntilDestroyed(this.destroyRef),
				filter(([tableOptions, records]) => !_.isNil(tableOptions) && !_.isNil(records))
			)
			.subscribe(() => {
				if (!_.isNil(this.crudRecordFg)) {
					const payload = this.paymentHistoryService.paymentOperationAsHistoryRecord();

					if (!_.isNil(payload)) {
						this.crudRecordFg.patchValue({
							key: payload.key,
							operationDate: payload.operationDate,
							contractor: payload.contractor,
							category: payload.category,
							income: payload.income,
							expense: payload.expense,
							comment: payload.comment,
						});
					}
				}
			});
	}

	public async applyChangesAsync(): Promise<void> {
		await this.accountingOperationsService.updateAsync(this.selectedPaymentSignal());
	}

	public async addRecordAsync(): Promise<void> {
		const records = this.accountingRecordsSignal();

		if (!_.isEmpty(records) && _.some(records, { key: Guid.EMPTY })) {
			return;
		}

		await this.accountingOperationsService.addAsync();
	}

	public async deleteRecordAsync(): Promise<void> {
		const recordIdForDelete = this.selectedPaymentSignal()?.key;

		await this.accountingOperationsService.deleteByIdAsync(recordIdForDelete);
	}

	public addCategory(): void {
		this.categoriesDialogService.openCategories();
	}

	public addContractor(): void {
		this.contractorsDialogService.openContractors();
	}
}
