import { appRoutes } from '../../app/modules/app-bootstrap/app-bootstrap-routing.module';
import { AccountingLayoutComponent } from '../../app/modules/app-bootstrap/components/accounting-layout/accounting-layout.component';
import { DashboardLayoutComponent } from '../../app/modules/app-bootstrap/components/dashboard-layout/dashboard-layout.component';
import { PageNotFoundComponent } from '../../app/modules/shared/components/page-not-found/page-not-found.component';
import { LoaderService } from '../../app/modules/shared/services/loader-service';
import { NationalBankCurrenciesProvider } from '../../data/providers/rates/national-bank-currencies.provider';
import { accountingRoutes } from '../../presentation/accounting/accounting-routing.module';
import { AccountingOperationsCrudComponent } from '../../presentation/accounting/components/accounting-operations-crud/accounting-operations-crud.component';
import { PaymentAccountComponent } from '../../presentation/accounting/components/payment-account/payment-account.component';
import { PaymentAccountCrudComponent } from '../../presentation/accounting/components/payment-account-crud/payment-account-crud.component';
import { PaymentsDashboardComponent } from '../../presentation/accounting/components/payments-dashboard/payments-dashboard.component';
import { CurrencyRatesDashboardComponent } from '../../presentation/currency-rates/components/currency-rates-dashboard/currency-rates-dashboard.component';
import { currencyRatesRoutes } from '../../presentation/currency-rates/currency-rates.routes';
import { CurrencyRatesGridService } from '../../presentation/currency-rates/services/currency-rates-grid.service';
import { LineChartService } from '../../presentation/currency-rates/services/line-chart.service';
import { RatesDialogService } from '../../presentation/currency-rates/services/rates-dialog.service';
import { MainDashboardComponent } from '../../presentation/main-dashboard/components/dashboard/main-dashboard.component';
import { mainDashboardRoutes } from '../../presentation/main-dashboard/main-dashboard.routes';

describe('SPA routing', () => {
	it('configures app bootstrap routes for dashboard and not found flows', async () => {
		const dashboardRoute = appRoutes.find(route => route.path === 'dashboard');
		const loadedDashboardBoundary = await dashboardRoute?.loadChildren?.();

		expect(appRoutes).toContain(jasmine.objectContaining({ path: '', redirectTo: 'dashboard', pathMatch: 'full' }));
		expect(dashboardRoute).toEqual(jasmine.objectContaining({ path: 'dashboard' }));
		expect(dashboardRoute?.loadChildren).toBeDefined();
		expect(Array.isArray(loadedDashboardBoundary)).toBeTrue();
		expect(typeof loadedDashboardBoundary).not.toBe('function');
		expect(loadedDashboardBoundary).toBe(mainDashboardRoutes);
		expect(appRoutes).toContain(jasmine.objectContaining({ path: '**', component: PageNotFoundComponent }));
	});

	it('keeps dashboard feature navigation under the dashboard shell', async () => {
		const shellRoute = mainDashboardRoutes.find(route => route.path === '');
		const currencyRatesRoute = mainDashboardRoutes.find(route => route.path === 'currency-rates');
		const accountingRoute = mainDashboardRoutes.find(route => route.path === 'accounting');
		const loadedCurrencyRatesBoundary = await currencyRatesRoute?.loadChildren?.();

		expect(shellRoute?.component).toBe(DashboardLayoutComponent);
		expect(shellRoute?.children).toContain(
			jasmine.objectContaining({ path: '', component: MainDashboardComponent })
		);
		expect(currencyRatesRoute?.component).toBe(DashboardLayoutComponent);
		expect(currencyRatesRoute?.loadChildren).toBeDefined();
		expect(Array.isArray(loadedCurrencyRatesBoundary)).toBeTrue();
		expect(typeof loadedCurrencyRatesBoundary).not.toBe('function');
		expect(loadedCurrencyRatesBoundary).toBe(currencyRatesRoutes);
		expect(accountingRoute?.component).toBe(AccountingLayoutComponent);
		expect(accountingRoute?.loadChildren).toBeDefined();
	});

	it('routes currency rates feature to the rates dashboard', () => {
		const currencyRatesDefaultRoute = currencyRatesRoutes.find(route => route.path === '');

		expect(currencyRatesDefaultRoute?.component).toBe(CurrencyRatesDashboardComponent);
		expect(currencyRatesDefaultRoute?.providers).toContain(LineChartService);
		expect(currencyRatesDefaultRoute?.providers).toContain(RatesDialogService);
		expect(currencyRatesDefaultRoute?.providers).toContain(NationalBankCurrenciesProvider);
		expect(currencyRatesDefaultRoute?.providers).toContain(CurrencyRatesGridService);
		expect(currencyRatesDefaultRoute?.providers).toContain(LoaderService);
	});

	it('routes accounting primary and right-sidebar flows together', () => {
		expect(accountingRoutes).toContain(jasmine.objectContaining({ path: '', component: PaymentAccountComponent }));
		expect(accountingRoutes).toContain(
			jasmine.objectContaining({ path: '', outlet: 'right_sidebar', component: PaymentAccountCrudComponent })
		);
		expect(accountingRoutes).toContain(
			jasmine.objectContaining({ path: 'operations', component: PaymentsDashboardComponent })
		);
		expect(accountingRoutes).toContain(
			jasmine.objectContaining({
				path: 'operations',
				outlet: 'right_sidebar',
				component: AccountingOperationsCrudComponent,
			})
		);
	});
});
