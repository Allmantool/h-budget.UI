/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';

import { MapperModule } from '@dynamic-mapper/angular';
import { NgxsModule, Store } from '@ngxs/store';
import { of } from 'rxjs';
import { Guid } from 'typescript-guid';

import { AppCoreModule } from 'app/modules/core';
import { AngularMaterailSharedModule } from 'app/modules/shared/angular-material.shared.module';
import { CustomUIComponentsSharedModule } from 'app/modules/shared/custom-ui-components.shared.module';
import { DialogsSharedModule } from 'app/modules/shared/dialogs.shared.module';
import { ngxsConfig } from 'app/modules/shared/store/ngxs.config';
import { Result } from 'core/result';
import { AccountingRoutingModule } from 'presentation/accounting';
import { IPaymentRepresentationModel } from 'presentation/accounting/models/operation-record';

import { AppSharedModule } from '../../../app/modules/shared/shared.module';
import { AccountingOperationsTableState } from '../../../app/modules/shared/store/states/accounting/accounting-operations-table.state';
import { PaymentAccountState } from '../../../app/modules/shared/store/states/accounting/payment-account.state';
import { CategoriesState } from '../../../app/modules/shared/store/states/handbooks/categories.state';
import { ContractorsState } from '../../../app/modules/shared/store/states/handbooks/contractors.state';
import { HandbbooksState } from '../../../app/modules/shared/store/states/handbooks/handbooks.state';
import { DataCategoryProfile } from '../../../data/providers/accounting/mappers/category.mapping.profile';
import { DataContractorProfile } from '../../../data/providers/accounting/mappers/contractor.mapping.profile';
import { PaymentHistoryMappingProfile } from '../../../data/providers/accounting/mappers/payment-history.mapping.profile';
import { DefaultPaymentAccountsProvider } from '../../../data/providers/accounting/payment-accounts.provider';
import { AccountingOperationsCrudComponent } from '../../../presentation/accounting/components/accounting-operations-crud/accounting-operations-crud.component';
import { AccountingOperationsService } from '../../../presentation/accounting/services/accounting-operations.service';
import { CategoriesDialogService } from '../../../presentation/accounting/services/categories-dialog.service';
import { ContractorsDialogService } from '../../../presentation/accounting/services/counterparties-dialog.service';
import { PaymentsHistoryService } from '../../../presentation/accounting/services/payments-history.service';
import { AccountTypes } from 'domain/models/accounting/account-types';
import { IPaymentAccountModel } from 'domain/models/accounting/payment-account.model';

describe('Accouting operations crud component', () => {
	let sut: AccountingOperationsCrudComponent;

	let accountingOperationsServiceSpy: AccountingOperationsService;
	let categoriesDialogServiceSpy: CategoriesDialogService;
	let contractorsDialogServiceSpy: ContractorsDialogService;
	let paymentHistoryServiceSpy: PaymentsHistoryService;
	let paymentAccountsProviderSpy: DefaultPaymentAccountsProvider;

	let store: Store;

	beforeEach(() => {
		accountingOperationsServiceSpy = jasmine.createSpyObj<AccountingOperationsService>(
			'accountingOperationsService',
			{
				updateOperationAsync: new Promise(() => new Result({ payload: true })),
				addOperationAsync: new Promise(() => new Result({ payload: {} as IPaymentRepresentationModel })),
				deleteOperationByGuidAsync: new Promise(() => new Result({ payload: true })),
			}
		);

		categoriesDialogServiceSpy = jasmine.createSpyObj<CategoriesDialogService>('categoriesDialogService', {
			openCategories: undefined,
		});

		contractorsDialogServiceSpy = jasmine.createSpyObj<ContractorsDialogService>('contractorsDialogService', {
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

		paymentAccountsProviderSpy = jasmine.createSpyObj<DefaultPaymentAccountsProvider>('paymentAccountsProvider', {
			getPaymentAccountById: of({
				key: Guid.parse('464f061b-23e2-4b9d-af69-dbe1ab2d25e9'),
				balance: 0.11,
				currency: 'USD',
				description: 'test-description',
				emitter: 'emitter-test',
				type: AccountTypes.WalletCache,
			} as IPaymentAccountModel),
		});

		TestBed.configureTestingModule({
			imports: [
				AppSharedModule,
				AngularMaterailSharedModule,
				CustomUIComponentsSharedModule,
				AppCoreModule,
				AccountingRoutingModule,
				DialogsSharedModule,
				ReactiveFormsModule,
				NgxsModule.forRoot(
					[
						HandbbooksState,
						ContractorsState,
						CategoriesState,
						PaymentAccountState,
						PaymentAccountState,
						AccountingOperationsTableState,
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
				{
					provide: DefaultPaymentAccountsProvider,
					useValue: paymentAccountsProviderSpy,
				},
			],
		}).compileComponents();

		sut = TestBed.inject(AccountingOperationsCrudComponent);
	});

	it('Should be initialized AccountingOperationsCrudComponent with "ngAfterViewInit"', (done: DoneFn) => {
		sut.ngOnInit();
		done();
	});
});
