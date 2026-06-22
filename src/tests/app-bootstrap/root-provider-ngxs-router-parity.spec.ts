import { provideLocationMocks } from '@angular/common/testing';
import { createEnvironmentInjector, EnvironmentInjector, ErrorHandler, Provider } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { PreloadAllModules, PreloadingStrategy, Router, ROUTES } from '@angular/router';

import { NgxsReduxDevtoolsPlugin } from '@ngxs/devtools-plugin';
import { NgxsLoggerPlugin } from '@ngxs/logger-plugin';
import { Store } from '@ngxs/store';
import { NGXS_PLUGINS } from '@ngxs/store/plugins';

import { createStandaloneRootTestProviders } from './support/standalone-root-provider-test-config';
import { appRoutes } from '../../app/modules/app-bootstrap/app-bootstrap-routing.module';
import {
	AddProcessingRequest,
	RemoveProcessingRequest,
} from '../../app/modules/shared/store/states/core/actions/core-app.actions';
import { requestsUnderProcessing } from '../../app/modules/shared/store/states/core/selectors/core-app.selectors';
import { accountingRoutes } from '../../presentation/accounting/accounting.routes';
import { currencyRatesRoutes } from '../../presentation/currency-rates/currency-rates.routes';
import { mainDashboardRoutes } from '../../presentation/main-dashboard/main-dashboard.routes';

describe('root provider NGXS and router parity', () => {
	let featureInjectors: EnvironmentInjector[];

	beforeEach(() => {
		featureInjectors = [];
	});

	afterEach(() => {
		featureInjectors.forEach(injector => injector.destroy());
	});

	it('registers the root NGXS state with the current initial shape and action behavior', () => {
		configureRootProviders(false);

		const store = TestBed.inject(Store);

		expect(store.snapshot()).toEqual(
			jasmine.objectContaining({
				coreAppState: {
					requestsUnderProcessing: [],
				},
			})
		);
		expect(store.selectSnapshot(requestsUnderProcessing)).toEqual([]);

		store.dispatch(new AddProcessingRequest('request-a'));
		store.dispatch(new AddProcessingRequest('request-b'));

		expect(store.selectSnapshot(requestsUnderProcessing)).toEqual(['request-a', 'request-b']);

		store.dispatch(new RemoveProcessingRequest('request-a'));

		expect(store.selectSnapshot(requestsUnderProcessing)).toEqual(['request-b']);
	});

	it('keeps lazy feature NGXS compatibility bridges valid after the root scaffold is created', () => {
		configureRootProviders(false);

		const parentInjector = TestBed.inject(EnvironmentInjector);

		expect(() => {
			featureInjectors.push(createEnvironmentInjector(accountingRoutes[0].providers ?? [], parentInjector));
			featureInjectors.push(createEnvironmentInjector(currencyRatesRoutes[0].providers ?? [], parentInjector));
		}).not.toThrow();
	});

	it('keeps the logger plugin before Redux DevTools in development mode', () => {
		configureRootProviders(false);

		const plugins = TestBed.inject(NGXS_PLUGINS);

		expect(plugins[0]).toEqual(jasmine.any(NgxsLoggerPlugin));
		expect(plugins[1]).toEqual(jasmine.any(NgxsReduxDevtoolsPlugin));
	});

	it('excludes Redux DevTools in production mode while retaining the logger plugin', () => {
		configureRootProviders(true);

		const plugins = TestBed.inject(NGXS_PLUGINS);

		expect(plugins.some(plugin => plugin instanceof NgxsLoggerPlugin)).toBeTrue();
		expect(plugins.some(plugin => plugin instanceof NgxsReduxDevtoolsPlugin)).toBeFalse();
	});

	it('registers appRoutes and PreloadAllModules through provider-based router configuration', () => {
		configureRootProviders(false);

		const router = TestBed.inject(Router);
		const routeProviders = TestBed.inject(ROUTES);
		const preloadingStrategy = TestBed.inject(PreloadingStrategy);

		expect(router.config).toEqual(appRoutes);
		expect(routeProviders).toContain(appRoutes);
		expect(preloadingStrategy).toEqual(jasmine.any(PreloadAllModules));
		expect(appRoutes).toContain(jasmine.objectContaining({ path: '', redirectTo: 'dashboard', pathMatch: 'full' }));
		expect(appRoutes).toContain(jasmine.objectContaining({ path: '**' }));
	});

	it('keeps root and dashboard feature boundaries lazy through route-array imports', async () => {
		const dashboardRoute = appRoutes.find(route => route.path === 'dashboard');
		const currencyRatesRoute = mainDashboardRoutes.find(route => route.path === 'currency-rates');
		const accountingRoute = mainDashboardRoutes.find(route => route.path === 'accounting');

		expect(dashboardRoute?.loadChildren?.toString()).toContain('main-dashboard.routes');
		expect(currencyRatesRoute?.loadChildren?.toString()).toContain('currency-rates.routes');
		expect(accountingRoute?.loadChildren?.toString()).toContain('accounting.routes');
		expect(await dashboardRoute?.loadChildren?.()).toBe(mainDashboardRoutes);
		expect(await currencyRatesRoute?.loadChildren?.()).toBe(currencyRatesRoutes);
		expect(await accountingRoute?.loadChildren?.()).toBe(accountingRoutes);
	});

	function configureRootProviders(production: boolean): void {
		TestBed.resetTestingModule();
		TestBed.configureTestingModule({
			providers: [
				...createStandaloneRootTestProviders({
					production,
					includeAnimations: false,
					loadSettings: () => Promise.resolve(undefined),
					createErrorHandler: () => new ErrorHandler(),
				}),
				provideLocationMocks(),
			] as Provider[],
		});
	}
});
