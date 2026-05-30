import { TestBed } from '@angular/core/testing';
import { Route, ROUTES } from '@angular/router';

import { BootstrapRoutingModule } from '../../app/modules/app-bootstrap/app-bootstrap-routing.module';
import { AccountingLayoutComponent } from '../../app/modules/app-bootstrap/components/accounting-layout/accounting-layout.component';
import { DashboardLayoutComponent } from '../../app/modules/app-bootstrap/components/dashboard-layout/dashboard-layout.component';
import { PageNotFoundComponent } from '../../app/modules/shared/components/page-not-found/page-not-found.component';
import { AccountingRoutingModule } from '../../presentation/accounting/accounting-routing.module';
import { AccountingOperationsCrudComponent } from '../../presentation/accounting/components/accounting-operations-crud/accounting-operations-crud.component';
import { PaymentAccountComponent } from '../../presentation/accounting/components/payment-account/payment-account.component';
import { PaymentAccountCrudComponent } from '../../presentation/accounting/components/payment-account-crud/payment-account-crud.component';
import { PaymentsDashboardComponent } from '../../presentation/accounting/components/payments-dashboard/payments-dashboard.component';
import { CurrencyRatesDashboardComponent } from '../../presentation/currency-rates/components/currency-rates-dashboard/currency-rates-dashboard.component';
import { CurrencyRatesRoutingModule } from '../../presentation/currency-rates/currency-rates-routing.module';
import { MainDashboardComponent } from '../../presentation/main-dashboard/components/dashboard/main-dashboard.component';
import { MainDashboardRoutingModule } from '../../presentation/main-dashboard/main-dashboard-routing.module';

function configuredRoutes(): Route[] {
	return TestBed.inject(ROUTES).flat();
}

describe('SPA routing', () => {
	afterEach(() => TestBed.resetTestingModule());

	it('configures app bootstrap routes for dashboard and not found flows', () => {
		TestBed.configureTestingModule({
			imports: [BootstrapRoutingModule],
		});

		const routes = configuredRoutes();

		expect(routes).toContain(jasmine.objectContaining({ path: '', redirectTo: 'dashboard', pathMatch: 'full' }));
		expect(routes).toContain(jasmine.objectContaining({ path: 'dashboard' }));
		expect(routes.find(route => route.path === 'dashboard')?.loadChildren).toBeDefined();
		expect(routes).toContain(jasmine.objectContaining({ path: '**', component: PageNotFoundComponent }));
	});

	it('keeps dashboard feature navigation under the dashboard shell', () => {
		TestBed.configureTestingModule({
			imports: [MainDashboardRoutingModule],
		});

		const routes = configuredRoutes();
		const shellRoute = routes.find(route => route.path === '');
		const currencyRatesRoute = routes.find(route => route.path === 'currency-rates');
		const accountingRoute = routes.find(route => route.path === 'accounting');

		expect(shellRoute?.component).toBe(DashboardLayoutComponent);
		expect(shellRoute?.children).toContain(
			jasmine.objectContaining({ path: '', component: MainDashboardComponent })
		);
		expect(currencyRatesRoute?.component).toBe(DashboardLayoutComponent);
		expect(currencyRatesRoute?.loadChildren).toBeDefined();
		expect(accountingRoute?.component).toBe(AccountingLayoutComponent);
		expect(accountingRoute?.loadChildren).toBeDefined();
	});

	it('routes currency rates feature to the rates dashboard', () => {
		TestBed.configureTestingModule({
			imports: [CurrencyRatesRoutingModule],
		});

		expect(configuredRoutes()).toContain(
			jasmine.objectContaining({ path: '', component: CurrencyRatesDashboardComponent })
		);
	});

	it('routes accounting primary and right-sidebar flows together', () => {
		TestBed.configureTestingModule({
			imports: [AccountingRoutingModule],
		});

		const routes = configuredRoutes();

		expect(routes).toContain(jasmine.objectContaining({ path: '', component: PaymentAccountComponent }));
		expect(routes).toContain(
			jasmine.objectContaining({ path: '', outlet: 'right_sidebar', component: PaymentAccountCrudComponent })
		);
		expect(routes).toContain(
			jasmine.objectContaining({ path: 'operations', component: PaymentsDashboardComponent })
		);
		expect(routes).toContain(
			jasmine.objectContaining({
				path: 'operations',
				outlet: 'right_sidebar',
				component: AccountingOperationsCrudComponent,
			})
		);
	});
});
