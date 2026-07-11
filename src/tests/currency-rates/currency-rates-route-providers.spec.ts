import { Component, createEnvironmentInjector, EnvironmentInjector, Provider } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatDialogConfig } from '@angular/material/dialog';
import { Title } from '@angular/platform-browser';
import { provideRouter, Routes } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { Mapper } from '@dynamic-mapper/angular';
import { NgxsModule, Store } from '@ngxs/store';
import { of, Subject } from 'rxjs';

import { DateRangeDialogComponent } from '../../app/modules/shared/components/dialog/dates-rage/dates-range-dialog.component';
import { RatesGridDefaultOptions } from '../../app/modules/shared/constants/rates-grid-default-options';
import { DialogContainer } from '../../app/modules/shared/models/dialog-container';
import { DialogProvider } from '../../app/modules/shared/providers/dialog-provider';
import { LoaderService } from '../../app/modules/shared/services/loader-service';
import { ngxsConfig } from '../../app/modules/shared/store/ngxs.config';
import { AddCurrencyGroups } from '../../app/modules/shared/store/states/rates/actions/currency.actions';
import { ICurrencyChartStateModel } from '../../app/modules/shared/store/states/rates/models/currency-chart-state.model';
import { ICurrencyRatesStateModel } from '../../app/modules/shared/store/states/rates/models/currency-rates-state.model';
import { ICurrencyTableStateModel } from '../../app/modules/shared/store/states/rates/models/currency-table-state.model';
import { NationalBankCurrenciesProvider } from '../../data/providers/rates/national-bank-currencies.provider';
import { DaysRangePayload } from '../../domain/models/dates-range-payload.model';
import { CurrencyRateValueModel } from '../../domain/models/rates/currency-rate-value.model';
import { CurrencyRateGroupModel } from '../../domain/models/rates/currency-rates-group.model';
import { currencyRatesRoutes } from '../../presentation/currency-rates/currency-rates.routes';
import { PresentationRatesMappingProfile } from '../../presentation/currency-rates/mappers/presentation-rates-mapping.profiler';
import { CurrencyGridRateModel } from '../../presentation/currency-rates/models/currency-grid-rate.model';
import { CurrencyRatesGridService } from '../../presentation/currency-rates/services/currency-rates-grid.service';
import { LineChartService } from '../../presentation/currency-rates/services/line-chart.service';
import { RatesDialogService } from '../../presentation/currency-rates/services/rates-dialog.service';

interface CurrencyRatesFeatureState {
	currencyState: ICurrencyRatesStateModel & {
		currencyTableState: ICurrencyTableStateModel;
		currencyChartState: ICurrencyChartStateModel;
	};
}

@Component({
	standalone: true,
	template: '',
})
class RoutePlaceholderComponent {}

describe('currency rates route providers', () => {
	let parentInjector: EnvironmentInjector;
	let featureInjectors: EnvironmentInjector[];
	let currencyRateProviderSpy: jasmine.SpyObj<NationalBankCurrenciesProvider>;

	beforeEach(() => {
		featureInjectors = [];
		currencyRateProviderSpy = createCurrencyProviderSpy();

		TestBed.configureTestingModule({
			imports: [NgxsModule.forRoot([], ngxsConfig)],
		});

		parentInjector = TestBed.inject(EnvironmentInjector);
	});

	afterEach(() => {
		featureInjectors.forEach(injector => injector.destroy());
	});

	it('resolves Currency Rates services only from the feature route injector', () => {
		const featureInjector = createFeatureInjector();
		const featureLoader = featureInjector.get(LoaderService);

		expect(parentInjector.get(LineChartService, null)).toBeNull();
		expect(parentInjector.get(RatesDialogService, null)).toBeNull();
		expect(parentInjector.get(NationalBankCurrenciesProvider, null)).toBeNull();
		expect(parentInjector.get(CurrencyRatesGridService, null)).toBeNull();
		expect(parentInjector.get(LoaderService)).not.toBe(featureLoader);
		expect(featureInjector.get(LineChartService)).toEqual(jasmine.any(LineChartService));
		expect(featureInjector.get(RatesDialogService)).toEqual(jasmine.any(RatesDialogService));
		expect(featureInjector.get(NationalBankCurrenciesProvider)).toEqual(
			jasmine.any(NationalBankCurrenciesProvider)
		);
		expect(featureInjector.get(CurrencyRatesGridService)).toEqual(jasmine.any(CurrencyRatesGridService));
		expect(featureInjector.get(LoaderService)).toBe(featureLoader);
	});

	it('registers NGXS feature states and supports re-entering the route injector', () => {
		const firstFeatureInjector = createFeatureInjector([
			{ provide: NationalBankCurrenciesProvider, useValue: currencyRateProviderSpy },
		]);
		const firstStore = firstFeatureInjector.get(Store);

		expect(getCurrencyState(firstStore).rateGroups).toEqual([]);
		expect(getCurrencyState(firstStore).currencyTableState.tableOptions.selectedItem.currencyId).toBe(
			RatesGridDefaultOptions.CURRENCY_ID
		);
		expect(getCurrencyState(firstStore).currencyChartState.chartOptions.activeCurrencyTrendTitle).toBe('');

		firstStore.dispatch(new AddCurrencyGroups(sampleRateGroups));

		expect(getCurrencyState(firstStore).rateGroups.length).toBe(1);

		firstFeatureInjector.destroy();
		featureInjectors = featureInjectors.filter(injector => injector !== firstFeatureInjector);

		expect(() =>
			createFeatureInjector([{ provide: NationalBankCurrenciesProvider, useValue: currencyRateProviderSpy }])
		).not.toThrow();
	});

	it('keeps Dynamic Mapper profiles available from the route injector', () => {
		const featureInjector = createFeatureInjector();
		const mapper = featureInjector.get(Mapper);
		const gridRows: CurrencyGridRateModel[] = mapper.map(
			PresentationRatesMappingProfile.CurrencyRateGroupModelToGridRates,
			sampleRateGroups
		);

		expect(gridRows.length).toBe(1);
		expect(gridRows[0].currencyId).toBe(RatesGridDefaultOptions.CURRENCY_ID);
		expect(gridRows[0].abbreviation).toBe(RatesGridDefaultOptions.CURRENCY_ABBREVIATION);
		expect(gridRows[0].ratePerUnit).toBe(3.25);
	});

	it('preserves DialogProvider availability and the rates dialog service flow', () => {
		const periodRateGroupsSubject = new Subject<CurrencyRateGroupModel[]>();
		const dialogProviderSpy = jasmine.createSpyObj<DialogProvider>('dialogProvider', ['openDialog']);
		let loadedCount = 0;
		let cancelEmitted = false;

		currencyRateProviderSpy.getCurrenciesForSpecifiedPeriod.and.returnValue(periodRateGroupsSubject);

		const featureInjector = createFeatureInjector([
			{ provide: NationalBankCurrenciesProvider, useValue: currencyRateProviderSpy },
			{ provide: DialogProvider, useValue: dialogProviderSpy },
		]);
		const dialogService = featureInjector.get(RatesDialogService);
		const store = featureInjector.get(Store);

		expect(createFeatureInjector().get(DialogProvider)).toEqual(jasmine.any(DialogProvider));

		dialogService.openLoadRatesForPeriod();

		const [componentRef, dialogConfig] = dialogProviderSpy.openDialog.calls.mostRecent().args;
		const typedDialogConfig = dialogConfig as MatDialogConfig<DialogContainer<DaysRangePayload, number>>;

		expect(componentRef).toBe(DateRangeDialogComponent);
		expect(typedDialogConfig.data?.title).toBe('Update rates for specify period:');

		typedDialogConfig.data!.onSubmit(null as unknown as DaysRangePayload).subscribe(() => {
			cancelEmitted = true;
		});

		expect(cancelEmitted).toBeFalse();
		expect(currencyRateProviderSpy.getCurrenciesForSpecifiedPeriod.calls.any()).toBeFalse();

		typedDialogConfig
			.data!.onSubmit(
				new DaysRangePayload({
					startDate: new Date(2024, 0, 1),
					endDate: new Date(2024, 0, 31),
				})
			)
			.subscribe(result => {
				loadedCount = result;
			});

		periodRateGroupsSubject.next(sampleRateGroups);

		expect(loadedCount).toBe(1);
		expect(getCurrencyState(store).rateGroups.length).toBe(1);
	});

	function createFeatureInjector(extraProviders: Provider[] = []): EnvironmentInjector {
		const featureInjector = createEnvironmentInjector(
			[...getCurrencyRatesRouteProviders(), ...extraProviders],
			parentInjector,
			'CurrencyRatesRouteProvidersSpec'
		);

		featureInjectors.push(featureInjector);

		return featureInjector;
	}
});

describe('currency rates lazy route activation', () => {
	let currencyRateProviderSpy: jasmine.SpyObj<NationalBankCurrenciesProvider>;
	let dialogProviderSpy: jasmine.SpyObj<DialogProvider>;
	let titleSpy: jasmine.SpyObj<Title>;

	beforeEach(() => {
		currencyRateProviderSpy = createCurrencyProviderSpy();
		dialogProviderSpy = jasmine.createSpyObj<DialogProvider>('dialogProvider', ['openDialog']);
		titleSpy = jasmine.createSpyObj<Title>('title', ['setTitle']);

		TestBed.configureTestingModule({
			imports: [NgxsModule.forRoot([], ngxsConfig)],
			providers: [
				provideRouter([
					{
						path: '',
						redirectTo: 'dashboard',
						pathMatch: 'full',
					},
					{
						path: 'dashboard',
						children: [
							{
								path: '',
								component: RoutePlaceholderComponent,
							},
							{
								path: 'currency-rates',
								loadChildren: () => Promise.resolve(getTestCurrencyRatesRoutes()),
							},
						],
					},
				]),
			],
		});
	});

	it('renders the standalone dashboard and re-enters without duplicate state registration', async () => {
		const harness = await RouterTestingHarness.create('/dashboard/currency-rates');

		expect(getHarnessText(harness)).toContain('Daily board and quick actions');
		expect(getHarnessText(harness)).toContain('USD selected');
		expect(getHarnessText(harness)).toContain('US Dollar');
		expect(currencyRateProviderSpy.getCurrencies.calls.count()).toBe(1);
		expect(currencyRateProviderSpy.getTodayCurrencies.calls.any()).toBeFalse();

		getTodayCurrencyRatesButton(harness).click();

		expect(currencyRateProviderSpy.getTodayCurrencies.calls.any()).toBeTrue();

		await harness.navigateByUrl('/dashboard');
		await harness.navigateByUrl('/dashboard/currency-rates');

		expect(getHarnessText(harness)).toContain('Daily board and quick actions');
		expect(getHarnessText(harness)).toContain('USD selected');
		expect(getHarnessText(harness)).toContain('US Dollar');
		expect(currencyRateProviderSpy.getCurrencies.calls.count()).toBe(1);
	});

	function getTestCurrencyRatesRoutes(): Routes {
		return [
			{
				...currencyRatesRoutes[0],
				providers: [
					...getCurrencyRatesRouteProviders(),
					{ provide: NationalBankCurrenciesProvider, useValue: currencyRateProviderSpy },
					{ provide: DialogProvider, useValue: dialogProviderSpy },
					{ provide: Title, useValue: titleSpy },
				],
			},
		];
	}
});

function createCurrencyProviderSpy(): jasmine.SpyObj<NationalBankCurrenciesProvider> {
	const currencyRateProviderSpy = jasmine.createSpyObj<NationalBankCurrenciesProvider>('currencyRatesProvider', [
		'getTodayCurrencies',
		'getCurrencies',
		'getCurrenciesForSpecifiedPeriod',
		'saveCurrencies',
	]);

	currencyRateProviderSpy.getTodayCurrencies.and.returnValue(of(sampleRateGroups));
	currencyRateProviderSpy.getCurrencies.and.returnValue(of(sampleRateGroups));
	currencyRateProviderSpy.getCurrenciesForSpecifiedPeriod.and.returnValue(of(sampleRateGroups));

	return currencyRateProviderSpy;
}

function getCurrencyRatesRouteProviders(): NonNullable<Routes[number]['providers']> {
	const route = currencyRatesRoutes.find(candidate => candidate.path === '');

	if (!route?.providers) {
		throw new Error('Expected the Currency Rates default route to expose route-scoped providers.');
	}

	return route.providers;
}

function getCurrencyState(store: Store): CurrencyRatesFeatureState['currencyState'] {
	const snapshot = store.snapshot() as CurrencyRatesFeatureState;

	return snapshot.currencyState;
}

function getHarnessText(harness: RouterTestingHarness): string {
	return harness.routeNativeElement?.textContent ?? '';
}

function getTodayCurrencyRatesButton(harness: RouterTestingHarness): HTMLButtonElement {
	const button = Array.from<HTMLButtonElement>(harness.routeNativeElement?.querySelectorAll('button') ?? []).find(
		element => element.textContent?.includes('Get today currency rates')
	);

	if (!button) {
		throw new Error('Expected the route to render the get today currency rates button.');
	}

	return button;
}

const sampleRateGroups: CurrencyRateGroupModel[] = [
	new CurrencyRateGroupModel({
		currencyId: RatesGridDefaultOptions.CURRENCY_ID,
		name: 'US Dollar',
		abbreviation: RatesGridDefaultOptions.CURRENCY_ABBREVIATION,
		scale: 1,
		rateValues: [
			new CurrencyRateValueModel({
				officialRate: 3.25,
				ratePerUnit: 3.25,
				updateDate: new Date(2024, 0, 15),
			}),
		],
	}),
];
