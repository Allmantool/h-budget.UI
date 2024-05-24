/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { MapperModule } from '@dynamic-mapper/angular';
import { NgxsModule, Store } from '@ngxs/store';
import { Guid } from 'typescript-guid';

import { SetInitialPaymentOperations } from 'app/modules/shared/store/states/accounting/actions/payment-operation.actions';

import { AppCoreModule } from '../../../app/modules/core/core.module';
import { AngularMaterialSharedModule } from '../../../app/modules/shared/angular-material.shared.module';
import { CustomUIComponentsSharedModule } from '../../../app/modules/shared/custom-ui-components.shared.module';
import { DialogsSharedModule } from '../../../app/modules/shared/dialogs.shared.module';
import { AppSharedModule } from '../../../app/modules/shared/shared.module';
import { ngxsConfig } from '../../../app/modules/shared/store/ngxs.config';
import { AccountingOperationsTableState } from '../../../app/modules/shared/store/states/accounting/accounting-operations-table.state';
import { SetActiveAccountingOperation } from '../../../app/modules/shared/store/states/accounting/actions/accounting-table-options.actions';
import { PaymentAccountState } from '../../../app/modules/shared/store/states/accounting/payment-account.state';
import { AccountingOperationsState } from '../../../app/modules/shared/store/states/accounting/payment-operations.state';
import { CategoriesState } from '../../../app/modules/shared/store/states/handbooks/categories.state';
import { ContractorsState } from '../../../app/modules/shared/store/states/handbooks/contractors.state';
import { HandbooksState } from '../../../app/modules/shared/store/states/handbooks/handbooks.state';
import { Result } from '../../../core/result';
import { DataCategoryProfile } from '../../../data/providers/accounting/mappers/category.mapping.profile';
import { DataContractorProfile } from '../../../data/providers/accounting/mappers/contractor.mapping.profile';
import { PaymentHistoryMappingProfile } from '../../../data/providers/accounting/mappers/payment-history.mapping.profile';
import { IPaymentOperationModel } from '../../../domain/models/accounting/payment-operation.model';
import { AccountingRoutingModule } from '../../../presentation/accounting/accounting-routing.module';
import { AccountingOperationsCrudComponent } from '../../../presentation/accounting/components/accounting-operations-crud/accounting-operations-crud.component';
import { IPaymentRepresentationModel } from '../../../presentation/accounting/models/operation-record';
import { AccountingOperationsService } from '../../../presentation/accounting/services/accounting-operations.service';
import { CategoriesDialogService } from '../../../presentation/accounting/services/categories-dialog.service';
import { ContractorsDialogService } from '../../../presentation/accounting/services/contractors-dialog.service';
import { PaymentsHistoryService } from '../../../presentation/accounting/services/payments-history.service';

describe('accounting operations crud component', () => {
	let sut: AccountingOperationsCrudComponent;

	let accountingOperationsServiceSpy: jasmine.SpyObj<AccountingOperationsService>;
	let categoriesDialogServiceSpy: CategoriesDialogService;
	let contractorsDialogServiceSpy: jasmine.SpyObj<ContractorsDialogService>;
	let paymentHistoryServiceSpy: PaymentsHistoryService;

	let store: Store;

	beforeEach(() => {
		accountingOperationsServiceSpy = jasmine.createSpyObj('accountingOperationsService', {
			updateAsync: () => new Promise(() => new Result({ payload: true })),
			addAsync: () => new Promise(() => new Result({ payload: {} as IPaymentRepresentationModel })),
			deleteByIdAsync: (_: IPaymentOperationModel): Promise<Result<boolean>> =>
				new Promise(() => new Result({ payload: true })),
		});

		categoriesDialogServiceSpy = jasmine.createSpyObj<CategoriesDialogService>('categoriesDialogService', {
			openCategories: undefined,
		});

		contractorsDialogServiceSpy = jasmine.createSpyObj('contractorsDialogService', {
			openContractors: undefined,
		});

		paymentHistoryServiceSpy = jasmine.createSpyObj<PaymentsHistoryService>('paymentHistoryService', {
			paymentOperationAsHistoryRecord: {
				key: Guid.parse('c596f11b-d44d-425f-8c90-0655c51318ad'),
				balance: 22,
				category: '',
				contractor: '',
				comment: '',
				expense: 0,
				income: 11,
				operationDate: new Date(2024, 0, 11),
			} as IPaymentRepresentationModel,
		});

		TestBed.configureTestingModule({
			imports: [
				AppSharedModule,
				AngularMaterialSharedModule,
				CustomUIComponentsSharedModule,
				AppCoreModule,
				AccountingRoutingModule,
				DialogsSharedModule,
				FormsModule,
				ReactiveFormsModule,
				NgxsModule.forRoot(
					[
						HandbooksState,
						ContractorsState,
						CategoriesState,
						PaymentAccountState,
						PaymentAccountState,
						AccountingOperationsTableState,
						AccountingOperationsState,
					],
					ngxsConfig
				),
				MapperModule.withProfiles([PaymentHistoryMappingProfile, DataContractorProfile, DataCategoryProfile]),
			],
			providers: [
				AccountingOperationsCrudComponent,
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
			],
		}).compileComponents();

		store = TestBed.inject(Store);
		sut = TestBed.inject(AccountingOperationsCrudComponent);
	});

	it('should be initialized AccountingOperationsCrudComponent with "ngAfterViewInit"', (done: DoneFn) => {
		sut.ngOnInit();
		done();
	});

	it('should adjust operations accordingly during "applyChangesAsync()"', async () => {
		store.dispatch(new SetActiveAccountingOperation(Guid.parse('24a07833-5cf5-4885-b09d-32c089fac4dd')));

		sut.crudRecordFg.patchValue({
			key: Guid.parse('24a07833-5cf5-4885-b09d-32c089fac4dd'),
			balance: 22,
			category: 'test:category-1:income',
			contractor: 'test:contractor-1',
			comment: 'test-comment',
			expense: 0,
			income: 11,
			operationDate: new Date(2024, 0, 11),
		} as IPaymentRepresentationModel);

		sut.crudRecordFg.markAsDirty();

		await sut.applyChangesAsync().then(result => {
			console.log(result);
		});
	});

	it('Verify that "addRecordAsync()" has not been executed if an existed record', async () => {
		store.dispatch(new SetActiveAccountingOperation(Guid.parse('24a07833-5cf5-4885-b09d-32c089fac4dd')));
		store.dispatch(
			new SetInitialPaymentOperations([
				{
					key: Guid.EMPTY,
				} as IPaymentOperationModel,
			])
		);
		await sut.addRecordAsync().then(() => {
			expect(accountingOperationsServiceSpy.addNewAsync).not.toHaveBeenCalled();
		});
	});

	it('Verify that "addRecordAsync()" has been executed if an brand new record', async () => {
		await sut.addRecordAsync().then(() => {
			expect(accountingOperationsServiceSpy.addNewAsync).toHaveBeenCalled();
		});
	});

	it('Verify that expected record key will be used by "deleteRecordAsync()"', async () => {
		const operationKey = Guid.parse('24a07833-5cf5-4885-b09d-32c089fac4dd');

		sut.crudRecordFg.patchValue({
			key: operationKey,
		} as IPaymentRepresentationModel);

		await sut.deleteRecordAsync().then(() => {
			expect(accountingOperationsServiceSpy.deleteByIdAsync).toHaveBeenCalledWith(operationKey);
		});
	});

	it('Verify that category dialog provider will be executed by "addCategory()"', (done: DoneFn) => {
		sut.addCategory();

		expect(categoriesDialogServiceSpy.openCategories).toHaveBeenCalled();
		done();
	});

	it('Verify that contractor dialog provider will be executed by "addContractor()"', (done: DoneFn) => {
		sut.addContractor();

		expect(contractorsDialogServiceSpy.openContractors).toHaveBeenCalled();
		done();
	});
});
