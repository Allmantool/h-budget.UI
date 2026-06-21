import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { NgxsModule, Store } from '@ngxs/store';
import { firstValueFrom, of } from 'rxjs';
import { Guid } from 'typescript-guid';

import { SelectDropdownOptions } from '../../../app/modules/shared/models/select-dropdown-options';
import { ngxsConfig } from '../../../app/modules/shared/store/ngxs.config';
import { AccountingOperationsTableState } from '../../../app/modules/shared/store/states/accounting/accounting-operations-table.state';
import { SetActiveAccountingOperation } from '../../../app/modules/shared/store/states/accounting/actions/accounting-table-options.actions';
import { SetActivePaymentAccount } from '../../../app/modules/shared/store/states/accounting/actions/payment-account.actions';
import { SetInitialPaymentOperations } from '../../../app/modules/shared/store/states/accounting/actions/payment-operation.actions';
import { PaymentAccountState } from '../../../app/modules/shared/store/states/accounting/payment-account.state';
import { AccountingOperationsState } from '../../../app/modules/shared/store/states/accounting/payment-operations.state';
import { getAccountPayments } from '../../../app/modules/shared/store/states/accounting/selectors/accounting.selectors';
import { getSelectedRecordGuid } from '../../../app/modules/shared/store/states/accounting/selectors/table-options.selectors';
import { SetInitialCategories } from '../../../app/modules/shared/store/states/handbooks/actions/category.actions';
import { SetInitialContractors } from '../../../app/modules/shared/store/states/handbooks/actions/contractor.actions';
import { CategoriesState } from '../../../app/modules/shared/store/states/handbooks/categories.state';
import { ContractorsState } from '../../../app/modules/shared/store/states/handbooks/contractors.state';
import { Result } from '../../../core/result';
import { CrossAccountsTransferProvider } from '../../../data/providers/accounting/cross-accounts-transfer.provider';
import { ICategoryModel } from '../../../domain/models/accounting/category.model';
import { IContractorModel } from '../../../domain/models/accounting/contractor.model.';
import { PaymentOperationTypes } from '../../../domain/models/accounting/operation-types';
import { IPaymentOperationModel } from '../../../domain/models/accounting/payment-operation.model';
import { OperationTypes } from '../../../domain/types/operation.types';
import { AccountingOperationsCrudComponent } from '../../../presentation/accounting/components/accounting-operations-crud/accounting-operations-crud.component';
import { IPaymentRepresentationModel } from '../../../presentation/accounting/models/operation-record';
import { AccountingOperationsService } from '../../../presentation/accounting/services/accounting-operations.service';
import { CategoriesDialogService } from '../../../presentation/accounting/services/categories-dialog.service';
import { ContractorsDialogService } from '../../../presentation/accounting/services/contractors-dialog.service';
import { PaymentsHistoryService } from '../../../presentation/accounting/services/payments-history.service';

describe('accounting operations CRUD component', () => {
	let fixture: ComponentFixture<AccountingOperationsCrudComponent>;
	let component: AccountingOperationsCrudComponent;
	let store: Store;

	let accountingOperationsServiceSpy: jasmine.SpyObj<AccountingOperationsService>;
	let categoriesDialogServiceSpy: jasmine.SpyObj<CategoriesDialogService>;
	let contractorsDialogServiceSpy: jasmine.SpyObj<ContractorsDialogService>;
	let paymentHistoryServiceSpy: jasmine.SpyObj<PaymentsHistoryService>;
	let crossAccountsTransferProviderSpy: jasmine.SpyObj<CrossAccountsTransferProvider>;

	const paymentAccountId = '24a07833-5cf5-4885-b09d-32c089fac4dd';
	const operationId = Guid.parse('c596f11b-d44d-425f-8c90-0655c51318ad');
	const transferOperationId = Guid.parse('5bb1a692-0a2f-45ec-a5df-f44a04c298b5');
	const expenseCategoryId = Guid.parse('c4d7ed46-dbeb-4633-b29d-5aa7b0735887');
	const incomeCategoryId = Guid.parse('d8a353e7-0407-44be-a7df-5da70d19f55d');
	const contractorId = Guid.parse('5128860d-f621-4d16-b612-1978e68b174c');
	const expenseCategoryName = 'Home: Groceries';
	const incomeCategoryName = 'Salary: Monthly';
	const contractorName = 'Acme: Payroll';

	const paymentOperation = createPaymentOperation(operationId, OperationTypes.Payment);
	const transferOperation = createPaymentOperation(transferOperationId, OperationTypes.Transfer);
	const historyRecord = createHistoryRecord(operationId, expenseCategoryName, contractorName);

	beforeEach(async () => {
		TestBed.resetTestingModule();

		accountingOperationsServiceSpy = jasmine.createSpyObj<AccountingOperationsService>(
			'accountingOperationsService',
			{
				updateAsync: Promise.resolve(new Result<boolean>({ isSucceeded: true, payload: true })),
				addNewAsync: Promise.resolve(new Result<IPaymentRepresentationModel>({ isSucceeded: true })),
				deleteByIdAsync: Promise.resolve(new Result<boolean>({ isSucceeded: true, payload: true })),
			}
		);
		categoriesDialogServiceSpy = jasmine.createSpyObj<CategoriesDialogService>('categoriesDialogService', [
			'openCategories',
		]);
		contractorsDialogServiceSpy = jasmine.createSpyObj<ContractorsDialogService>('contractorsDialogService', [
			'openContractors',
		]);
		paymentHistoryServiceSpy = jasmine.createSpyObj<PaymentsHistoryService>('paymentHistoryService', {
			paymentOperationAsHistoryRecord: historyRecord,
		});
		crossAccountsTransferProviderSpy = jasmine.createSpyObj<CrossAccountsTransferProvider>(
			'crossAccountsTransferProvider',
			{
				deleteById: of(new Result<Guid>({ isSucceeded: true, payload: transferOperationId })),
			}
		);

		await TestBed.configureTestingModule({
			imports: [
				AccountingOperationsCrudComponent,
				NoopAnimationsModule,
				NgxsModule.forRoot(
					[
						AccountingOperationsState,
						AccountingOperationsTableState,
						PaymentAccountState,
						CategoriesState,
						ContractorsState,
					],
					ngxsConfig
				),
			],
			providers: [
				{
					provide: AccountingOperationsService,
					useValue: accountingOperationsServiceSpy,
				},
				{
					provide: CategoriesDialogService,
					useValue: categoriesDialogServiceSpy,
				},
				{
					provide: ContractorsDialogService,
					useValue: contractorsDialogServiceSpy,
				},
				{
					provide: PaymentsHistoryService,
					useValue: paymentHistoryServiceSpy,
				},
				{
					provide: CrossAccountsTransferProvider,
					useValue: crossAccountsTransferProviderSpy,
				},
			],
		}).compileComponents();

		store = TestBed.inject(Store);
		await seedStore([paymentOperation], operationId);
		suppressExistingDisabledControlWarning();

		fixture = TestBed.createComponent(AccountingOperationsCrudComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
		await fixture.whenStable();
	});

	afterEach(() => {
		fixture.destroy();
		TestBed.resetTestingModule();
	});

	it('should create the standalone component and compile the real template', () => {
		expect(component).toBeTruthy();
		expect(component.crudRecordFg.contains('operationDate')).toBeTrue();
		expect(component.crudRecordFg.contains('contractor')).toBeTrue();
		expect(component.crudRecordFg.contains('category')).toBeTrue();
		expect(component.crudRecordFg.contains('income')).toBeTrue();
		expect(component.crudRecordFg.contains('expense')).toBeTrue();
		expect(component.crudRecordFg.contains('comment')).toBeTrue();
		expect(getNativeText()).toContain('Edit record');
		expect(getNativeText()).toContain('Contractor:');
		expect(getNativeText()).toContain('Category:');
		expect(getButtonTexts()).toContain(jasmine.stringContaining('Save changes'));
		expect(getButtonTexts()).toContain(jasmine.stringContaining('New record'));
		expect(getButtonTexts()).toContain(jasmine.stringContaining('Delete record'));
	});

	it('should patch the selected history record into the local disabled form', () => {
		expect(paymentHistoryServiceSpy.paymentOperationAsHistoryRecord.calls.count()).toBeGreaterThan(0);
		expect(component.crudRecordFg.get('key')?.value).toBe(historyRecord.key);
		expect(component.crudRecordFg.get('operationDate')?.value).toBe(historyRecord.operationDate);
		expect(component.crudRecordFg.get('category')?.value).toBe(historyRecord.category);
		expect(component.crudRecordFg.get('contractor')?.value).toBe(historyRecord.contractor);
	});

	it('should keep save and delete disabled when no operation is selected', async () => {
		await seedStore([], undefined);
		fixture.detectChanges();
		await fixture.whenStable();

		expect(component.isNotReadyForSaveSignal()).toBeTrue();
		expect(getButtonDisabledState('Save changes')).toBeTrue();
		expect(getButtonDisabledState('Delete record')).toBeTrue();
	});

	it('should preserve expense and income amount branch rendering', async () => {
		setSelectedCategory(expenseCategoryName);
		fixture.detectChanges();

		expect(component.isExpenseSignal()).toBeTrue();
		expect(getNativeText()).toContain('Amount(Expense)::');

		setSelectedCategory(incomeCategoryName);
		fixture.detectChanges();
		await fixture.whenStable();

		expect(component.isExpenseSignal()).toBeFalse();
		expect(getNativeText()).toContain('Amount(Income):');
	});

	it('should invoke update with the selected payment payload when changes are applied', async () => {
		component.crudRecordFg.patchValue({
			key: operationId,
			category: new SelectDropdownOptions({ description: expenseCategoryName, value: expenseCategoryName }),
			contractor: new SelectDropdownOptions({ description: contractorName, value: contractorName }),
		});

		await component.applyChangesAsync();

		const updatePayload = accountingOperationsServiceSpy.updateAsync.calls.mostRecent().args[0];
		expect(updatePayload.key).toBe(operationId);
		expect(updatePayload.paymentAccountId).toBe(paymentAccountId as unknown as Guid);
		expect(updatePayload.categoryId).toBe(expenseCategoryId);
		expect(updatePayload.contractorId).toBe(contractorId);
		expect(updatePayload.operationType).toBe(OperationTypes.Payment);
	});

	it('should not add a draft when a draft record already exists', async () => {
		await seedStore([{ ...paymentOperation, key: Guid.EMPTY }], Guid.EMPTY);

		await component.addRecordAsync();

		expect(accountingOperationsServiceSpy.addNewAsync.calls.count()).toBe(0);
	});

	it('should add a new draft when no draft record exists', async () => {
		await component.addRecordAsync();

		expect(accountingOperationsServiceSpy.addNewAsync.calls.count()).toBe(1);
	});

	it('should discard a local draft without calling the delete service', async () => {
		await seedStore([{ ...paymentOperation, key: Guid.EMPTY }], Guid.EMPTY);
		component.crudRecordFg.patchValue({
			key: Guid.EMPTY,
			category: new SelectDropdownOptions({ description: expenseCategoryName, value: expenseCategoryName }),
		});

		await component.deleteRecordAsync();

		expect(accountingOperationsServiceSpy.deleteByIdAsync.calls.count()).toBe(0);
		expect(store.selectSnapshot(getSelectedRecordGuid)).toBeUndefined();
		expect(store.selectSnapshot(getAccountPayments)).toEqual([]);
		expect(component.crudRecordFg.get('key')?.value).toBeNull();
	});

	it('should delete a transfer through the transfer provider before deleting the operation record', async () => {
		await seedStore([transferOperation], transferOperationId);
		component.crudRecordFg.patchValue({
			key: transferOperationId,
			category: new SelectDropdownOptions({ description: expenseCategoryName, value: expenseCategoryName }),
		});

		await component.deleteRecordAsync();

		expect(crossAccountsTransferProviderSpy.deleteById.calls.count()).toBe(1);
		expect(crossAccountsTransferProviderSpy.deleteById.calls.mostRecent().args).toEqual([
			paymentAccountId as unknown as Guid,
			transferOperationId,
		]);
		expect(accountingOperationsServiceSpy.deleteByIdAsync.calls.count()).toBe(1);
		expect(accountingOperationsServiceSpy.deleteByIdAsync.calls.mostRecent().args).toEqual([transferOperationId]);
	});

	it('should open the existing category and contractor management dialogs', () => {
		component.addCategory();
		component.addContractor();

		expect(categoriesDialogServiceSpy.openCategories.calls.count()).toBe(1);
		expect(contractorsDialogServiceSpy.openContractors.calls.count()).toBe(1);
	});

	async function seedStore(records: IPaymentOperationModel[], selectedOperationId: Guid | undefined): Promise<void> {
		await firstValueFrom(store.dispatch(new SetActivePaymentAccount(paymentAccountId)));
		await firstValueFrom(store.dispatch(new SetInitialPaymentOperations(records)));
		await firstValueFrom(store.dispatch(new SetActiveAccountingOperation(selectedOperationId)));
		await firstValueFrom(store.dispatch(new SetInitialCategories(createCategories())));
		await firstValueFrom(store.dispatch(new SetInitialContractors(createContractors())));
	}

	function setSelectedCategory(categoryName: string): void {
		component.crudRecordFg.get('category')?.patchValue(
			new SelectDropdownOptions({
				description: categoryName,
				value: categoryName,
			})
		);
	}

	function createPaymentOperation(key: Guid, operationType: OperationTypes): IPaymentOperationModel {
		return {
			key,
			paymentAccountId: Guid.parse(paymentAccountId),
			operationDate: new Date(2024, 0, 11),
			contractorId,
			categoryId: expenseCategoryId,
			comment: 'Initial operation',
			amount: 42,
			operationType,
		};
	}

	function createHistoryRecord(key: Guid, category: string, contractor: string): IPaymentRepresentationModel {
		return {
			key,
			balance: 22,
			category,
			contractor,
			comment: 'Initial history record',
			expense: 42,
			income: 0,
			operationDate: new Date(2024, 0, 11),
			operationType: OperationTypes.Payment,
		};
	}

	function createCategories(): ICategoryModel[] {
		return [
			{
				key: expenseCategoryId,
				operationType: PaymentOperationTypes.Expense,
				nameNodes: ['Home', 'Groceries'],
			},
			{
				key: incomeCategoryId,
				operationType: PaymentOperationTypes.Income,
				nameNodes: ['Salary', 'Monthly'],
			},
		];
	}

	function createContractors(): IContractorModel[] {
		return [
			{
				key: contractorId,
				nameNodes: ['Acme', 'Payroll'],
			},
		];
	}

	function getButtonTexts(): string[] {
		return getButtons().map(button => normalizeText(button.textContent ?? ''));
	}

	function getButtonDisabledState(buttonText: string): boolean | undefined {
		return getButtons().find(button => normalizeText(button.textContent ?? '').includes(buttonText))?.disabled;
	}

	function getButtons(): HTMLButtonElement[] {
		return Array.from(getNativeElement().querySelectorAll('button'));
	}

	function getNativeText(): string {
		return normalizeText(getNativeElement().textContent ?? '');
	}

	function normalizeText(value: string): string {
		return value.replace(/\s+/g, ' ').trim();
	}

	function getNativeElement(): HTMLElement {
		const nativeElement: unknown = fixture.nativeElement;

		if (!(nativeElement instanceof HTMLElement)) {
			throw new Error('Expected the component fixture to render an HTMLElement.');
		}

		return nativeElement;
	}

	function suppressExistingDisabledControlWarning(): void {
		const originalWarn = console.warn;

		spyOn(console, 'warn').and.callFake((message?: unknown, ...optionalParams: unknown[]) => {
			if (
				typeof message === 'string' &&
				message.includes('using the disabled attribute with a reactive form directive')
			) {
				return;
			}

			originalWarn.call(console, message, ...optionalParams);
		});
	}
});
