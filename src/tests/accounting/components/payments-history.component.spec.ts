/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { MapperModule } from '@dynamic-mapper/angular';
import { NgxsModule, Store } from '@ngxs/store';
import { of } from 'rxjs';
import { Guid } from 'typescript-guid';

import { ngxsConfig } from '../../../app/modules/shared/store/ngxs.config';
import { PaymentAccountState } from '../../../app/modules/shared/store/states/accounting/payment-account.state';
import { CategoriesState } from '../../../app/modules/shared/store/states/handbooks/categories.state';
import { ContractorsState } from '../../../app/modules/shared/store/states/handbooks/contractors.state';
import { HandbbooksState } from '../../../app/modules/shared/store/states/handbooks/handbooks.state';
import { DefaultCategoriesProvider } from '../../../data/providers/accounting/categories.provider';
import { DefaultContractorsProvider } from '../../../data/providers/accounting/contractors.provider';
import { DataCategoryProfile } from '../../../data/providers/accounting/mappers/category.mapping.profile';
import { DataContractorProfile } from '../../../data/providers/accounting/mappers/contractor.mapping.profile';
import { PaymentHistoryMappingProfile } from '../../../data/providers/accounting/mappers/payment-history.mapping.profile';
import { IContractorModel } from '../../../domain/models/accounting/contractor.model.';
import { PaymentsHistoryComponent } from '../../../presentation/accounting/components/payments-history/payments-history.component';
import { PaymentsHistoryService } from '../../../presentation/accounting/services/payments-history.service';

describe('Currency rates line chart component', () => {
	let sut: PaymentsHistoryComponent;

	let contractorsProviderSpy: DefaultContractorsProvider;
	let categoriesProvider: DefaultCategoriesProvider;
	let paymentsHistoryService: PaymentsHistoryService;

	let router: Router;
	let store: Store;

	beforeEach(() => {
		contractorsProviderSpy = jasmine.createSpyObj<DefaultContractorsProvider>('contractorsProvider', {
			getContractors: of([
				{
					key: Guid.EMPTY,
					nameNodes: [''],
				} as IContractorModel,
			]),
		});

		// eslint-disable-next-line @typescript-eslint/no-floating-promises
		TestBed.configureTestingModule({
			imports: [
				NgxsModule.forRoot(
					[HandbbooksState, ContractorsState, CategoriesState, PaymentAccountState],
					ngxsConfig
				),
				MapperModule.withProfiles([PaymentHistoryMappingProfile, DataContractorProfile, DataCategoryProfile]),
			],
			providers: [
				PaymentsHistoryComponent,
				{
					provide: DefaultContractorsProvider,
					useValue: contractorsProviderSpy,
				},
				{
					provide: DefaultCategoriesProvider,
					useValue: categoriesProvider,
				},
				{
					provide: PaymentsHistoryService,
					useValue: paymentsHistoryService,
				},
			],
		}).compileComponents();

		sut = TestBed.inject(PaymentsHistoryComponent);
		store = TestBed.inject(Store);
	});

	it('Should be initialized PaymentsHistoryComponent with "ngAfterViewInit"', (done: DoneFn) => {
		sut.ngOnInit();
	});
});
