import { EnvironmentInjector } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';

import { MapperModule } from '@dynamic-mapper/angular';
import { NgxsModule, Store } from '@ngxs/store';
import { BehaviorSubject, of } from 'rxjs';
import { Guid } from 'typescript-guid';

import { ngxsConfig } from '../../../app/modules/shared/store/ngxs.config';
import { SetActiveAccountingOperation } from '../../../app/modules/shared/store/states/accounting/actions/accounting-table-options.actions';
import { PaymentAccountState } from '../../../app/modules/shared/store/states/accounting/payment-account.state';
import { DefaultPaymentAccountsProvider } from '../../../data/providers/accounting/payment-accounts.provider';
import { AccountTypes } from '../../../domain/models/accounting/account-types';
import { IPaymentAccountModel } from '../../../domain/models/accounting/payment-account.model';
import { AccountingRoutingModule } from '../../../presentation/accounting/accounting-routing.module';
import { PaymentAccountComponent } from '../../../presentation/accounting/components/payment-account/payment-account.component';

describe('Payment account component', () => {
	let sut: PaymentAccountComponent;

	let paymentAccountsProviderSpy: DefaultPaymentAccountsProvider;

	const activatedRouteStub = { queryParams: new BehaviorSubject<object>({}) };

	let store: Store;

	beforeEach(() => {
		paymentAccountsProviderSpy = jasmine.createSpyObj<DefaultPaymentAccountsProvider>('paymentAccountsProvider', {
			getPaymentAccounts: of([
				{
					key: Guid.EMPTY,
					type: AccountTypes.Virtual,
					currency: '',
					balance: 0,
					emitter: '',
					description: '',
				} as IPaymentAccountModel,
			]),
		});

		void TestBed.configureTestingModule({
			imports: [
				AccountingRoutingModule,
				NgxsModule.forRoot([PaymentAccountState], ngxsConfig),
				MapperModule.withProfiles([]),
			],
			providers: [
				EnvironmentInjector,
				Router,
				PaymentAccountComponent,
				{
					provide: ActivatedRoute,
					useValue: activatedRouteStub,
				},
				{
					provide: DefaultPaymentAccountsProvider,
					useValue: paymentAccountsProviderSpy,
				},
			],
		}).compileComponents();

		store = TestBed.inject(Store);

		sut = TestBed.inject(PaymentAccountComponent);
	});

	it('should be initialized PaymentAccountComponent with "ngAfterViewInit"', (done: DoneFn) => {
		store.dispatch(new SetActiveAccountingOperation(Guid.parse('24a07833-5cf5-4885-b09d-32c089fac4dd')));
		sut.ngOnInit();
		done();
	});
});
