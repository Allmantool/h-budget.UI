/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { MapperModule } from '@dynamic-mapper/angular';
import { NgxsModule, Store } from '@ngxs/store';
import { of } from 'rxjs';
import { Guid } from 'typescript-guid';

import { ngxsConfig } from '../../../app/modules/shared/store/ngxs.config';
import { AccountingOperationsTableState } from '../../../app/modules/shared/store/states/accounting/accounting-operations-table.state';
import { SetActiveAccountingOperation } from '../../../app/modules/shared/store/states/accounting/actions/accounting-table-options.actions';
import {
	SetActivePaymentAccount,
	SetInitialPaymentAccounts,
} from '../../../app/modules/shared/store/states/accounting/actions/payment-acount.actions';
import { PaymentAccountState } from '../../../app/modules/shared/store/states/accounting/payment-account.state';
import { CategoriesState } from '../../../app/modules/shared/store/states/handbooks/categories.state';
import { ContractorsState } from '../../../app/modules/shared/store/states/handbooks/contractors.state';
import { HandbbooksState } from '../../../app/modules/shared/store/states/handbooks/handbooks.state';
import { DefaultCategoriesProvider } from '../../../data/providers/accounting/categories.provider';
import { DefaultContractorsProvider } from '../../../data/providers/accounting/contractors.provider';
import { DataCategoryProfile } from '../../../data/providers/accounting/mappers/category.mapping.profile';
import { DataContractorProfile } from '../../../data/providers/accounting/mappers/contractor.mapping.profile';
import { PaymentHistoryMappingProfile } from '../../../data/providers/accounting/mappers/payment-history.mapping.profile';
import { ICategoryModel } from '../../../domain/models/accounting/category.model';
import { IContractorModel } from '../../../domain/models/accounting/contractor.model.';
import { IPaymentAccountModel } from '../../../domain/models/accounting/payment-account.model';
import { AccountingRoutingModule } from '../../../presentation/accounting/accounting-routing.module';
import { PaymentsHistoryComponent } from '../../../presentation/accounting/components/payments-history/payments-history.component';
import { IPaymentRepresentationModel } from '../../../presentation/accounting/models/operation-record';
import { HandbooksService } from '../../../presentation/accounting/services/handbooks.service';
import { PaymentsHistoryService } from '../../../presentation/accounting/services/payments-history.service';
import { MainDashboardModule } from '../../../presentation/main-dashboard/main-dashboard.module';

describe('Currency rates line chart component', () => {
	let sut: PaymentsHistoryComponent;

	let contractorsProviderSpy: DefaultContractorsProvider;
	let categoriesProviderSpy: DefaultCategoriesProvider;
	let paymentsHistoryServiceSpy: PaymentsHistoryService;

	let router: Router;
	let store: Store;

	beforeEach(() => {
		contractorsProviderSpy = jasmine.createSpyObj<DefaultContractorsProvider>('contractorsProvider', {
			getContractors: of([
				{
					key: Guid.parse('f67501cd-d235-4147-8bd6-963ff2665398'),
					nameNodes: ['test', 'contractor-1'],
				} as IContractorModel,
			]),
		});

		categoriesProviderSpy = jasmine.createSpyObj<DefaultCategoriesProvider>('contractorsProvider', {
			getCategoriries: of([
				{
					key: Guid.parse('01dd7121-b40b-4a52-ad50-46f989b8efb9'),
					nameNodes: ['test', 'category-1'],
				} as ICategoryModel,
			]),
		});

		paymentsHistoryServiceSpy = jasmine.createSpyObj<PaymentsHistoryService>('paymentsHistoryService', {
			refreshPaymentsHistory: of([
				{
					key: Guid.parse('24a07833-5cf5-4885-b09d-32c089fac4dd'),
					operationDate: new Date(2024, 0, 15),
					contractor: '',
					category: '',
					income: 11,
					expense: 0,
					comment: 'test-comment',
					balance: 11,
				} as IPaymentRepresentationModel,
			]),
		});

		// eslint-disable-next-line @typescript-eslint/no-floating-promises
		TestBed.configureTestingModule({
			imports: [
				MainDashboardModule,
				AccountingRoutingModule,
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
				HandbooksService,
				PaymentsHistoryComponent,
				{
					provide: DefaultContractorsProvider,
					useValue: contractorsProviderSpy,
				},
				{
					provide: DefaultCategoriesProvider,
					useValue: categoriesProviderSpy,
				},
				{
					provide: PaymentsHistoryService,
					useValue: paymentsHistoryServiceSpy,
				},
			],
		}).compileComponents();

		store = TestBed.inject(Store);

		store.dispatch(new SetActivePaymentAccount('24a07833-5cf5-4885-b09d-32c089fac4dd'));
		store.dispatch(
			new SetInitialPaymentAccounts([
				{
					key: Guid.parse('24a07833-5cf5-4885-b09d-32c089fac4dd'),
					description: 'payment-account under test',
				} as IPaymentAccountModel,
			])
		);

		sut = TestBed.inject(PaymentsHistoryComponent);
	});

	it('Should be initialized PaymentsHistoryComponent with "ngAfterViewInit"', (done: DoneFn) => {
		store.dispatch(new SetActiveAccountingOperation(Guid.parse('24a07833-5cf5-4885-b09d-32c089fac4dd')));
		sut.ngOnInit();
		done();
	});
});
