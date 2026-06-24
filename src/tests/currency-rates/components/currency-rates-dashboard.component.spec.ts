import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';

import { MapperModule } from '@dynamic-mapper/angular';
import { NgxsModule, Store } from '@ngxs/store';
import { of, Subject } from 'rxjs';

import { RatesGridDefaultOptions } from '../../../app/modules/shared/constants/rates-grid-default-options';
import { DialogProvider } from '../../../app/modules/shared/providers/dialog-provider';
import { LoaderService } from '../../../app/modules/shared/services/loader-service';
import { ngxsConfig } from '../../../app/modules/shared/store/ngxs.config';
import {
	SetActiveCurrency,
	SetCurrencyDateRange,
} from '../../../app/modules/shared/store/states/rates/actions/currency-table-options.actions';
import { AddCurrencyGroups } from '../../../app/modules/shared/store/states/rates/actions/currency.actions';
import { CurrencyChartState } from '../../../app/modules/shared/store/states/rates/currency-chart.state';
import { CurrencyRatesState } from '../../../app/modules/shared/store/states/rates/currency-rates.state';
import { CurrencyTableState } from '../../../app/modules/shared/store/states/rates/currency-table.state';
import { ICurrencyTableStateModel } from '../../../app/modules/shared/store/states/rates/models/currency-table-state.model';
import { DataRatesMappingProfile } from '../../../data/providers/rates/mappers/data-rates-mapping.profiler';
import { NationalBankCurrenciesProvider } from '../../../data/providers/rates/national-bank-currencies.provider';
import { CurrencyRateValueModel } from '../../../domain/models/rates/currency-rate-value.model';
import { CurrencyRateGroupModel } from '../../../domain/models/rates/currency-rates-group.model';
import { CurrencyRatesDashboardComponent } from '../../../presentation/currency-rates/components/currency-rates-dashboard/currency-rates-dashboard.component';
import { PresentationRatesMappingProfile } from '../../../presentation/currency-rates/mappers/presentation-rates-mapping.profiler';
import { CurrencyRatesGridService } from '../../../presentation/currency-rates/services/currency-rates-grid.service';
import { LineChartService } from '../../../presentation/currency-rates/services/line-chart.service';
import { RatesDialogService } from '../../../presentation/currency-rates/services/rates-dialog.service';

interface CurrencyRatesDashboardTestState {
	currencyState: {
		currencyTableState: ICurrencyTableStateModel;
	};
}

describe('currency rates dashboard component', () => {
	let fixture: ComponentFixture<CurrencyRatesDashboardComponent>;
	let component: CurrencyRatesDashboardComponent;
	let store: Store;

	let currencyRateProviderSpy: jasmine.SpyObj<NationalBankCurrenciesProvider>;
	let dialogProviderSpy: jasmine.SpyObj<DialogProvider>;
	let titleSpy: jasmine.SpyObj<Title>;

	const selectedRangeEnd = new Date(2024, 0, 31);
	const sampleRateGroups: CurrencyRateGroupModel[] = [
		new CurrencyRateGroupModel({
			currencyId: RatesGridDefaultOptions.CURRENCY_ID,
			name: 'US Dollar',
			abbreviation: RatesGridDefaultOptions.CURRENCY_ABBREVIATION,
			scale: 1,
			rateValues: [
				new CurrencyRateValueModel({
					officialRate: 3,
					ratePerUnit: 3,
					updateDate: new Date(2024, 0, 1),
				}),
				new CurrencyRateValueModel({
					officialRate: 3.2,
					ratePerUnit: 3.2,
					updateDate: selectedRangeEnd,
				}),
			],
		}),
		new CurrencyRateGroupModel({
			currencyId: 451,
			name: 'Euro',
			abbreviation: 'EUR',
			scale: 1,
			rateValues: [
				new CurrencyRateValueModel({
					officialRate: 3.4,
					ratePerUnit: 3.4,
					updateDate: new Date(2024, 0, 1),
				}),
				new CurrencyRateValueModel({
					officialRate: 3.8,
					ratePerUnit: 3.8,
					updateDate: selectedRangeEnd,
				}),
			],
		}),
	];

	beforeEach(async () => {
		currencyRateProviderSpy = jasmine.createSpyObj<NationalBankCurrenciesProvider>('currencyRatesProvider', [
			'getTodayCurrencies',
			'getCurrencies',
			'getCurrenciesForSpecifiedPeriod',
		]);
		currencyRateProviderSpy.getTodayCurrencies.and.returnValue(of(sampleRateGroups));
		currencyRateProviderSpy.getCurrencies.and.returnValue(of(sampleRateGroups));
		currencyRateProviderSpy.getCurrenciesForSpecifiedPeriod.and.returnValue(of(sampleRateGroups));

		dialogProviderSpy = jasmine.createSpyObj<DialogProvider>('dialogProvider', ['openDialog']);
		titleSpy = jasmine.createSpyObj<Title>('title', ['setTitle']);

		await TestBed.configureTestingModule({
			imports: [
				NgxsModule.forRoot([CurrencyRatesState, CurrencyTableState, CurrencyChartState], ngxsConfig),
				MapperModule.withProfiles([DataRatesMappingProfile, PresentationRatesMappingProfile]),
				CurrencyRatesDashboardComponent,
			],
			providers: [
				LineChartService,
				RatesDialogService,
				CurrencyRatesGridService,
				LoaderService,
				{
					provide: NationalBankCurrenciesProvider,
					useValue: currencyRateProviderSpy,
				},
				{ provide: DialogProvider, useValue: dialogProviderSpy },
				{ provide: Title, useValue: titleSpy },
			],
		}).compileComponents();

		fixture = TestBed.createComponent(CurrencyRatesDashboardComponent);
		component = fixture.componentInstance;
		store = TestBed.inject(Store);
	});

	it('should create the standalone dashboard and compile the real feature template', async () => {
		seedPopulatedCurrencyState();

		await renderDashboard();

		expect(component).toBeTruthy();
		expect(titleSpy.setTitle.calls.mostRecent().args).toEqual(['H-Budget rates']);
		expect(getNativeElement().querySelector('app-currency-rates-grid')).not.toBeNull();
		expect(getNativeElement().querySelector('currency-rates-line-chart')).not.toBeNull();
		expect(getNativeElement().querySelectorAll('apx-chart').length).toBeGreaterThanOrEqual(2);
		expect(getNativeElement().querySelectorAll('mat-card').length).toBeGreaterThan(0);
		expect(getText()).toContain(`${RatesGridDefaultOptions.CURRENCY_ABBREVIATION} selected`);
		expect(getText()).toContain('Trend movers map');
		expect(getText()).toContain('Market position donut');
	});

	it('should render state-backed selected currency, comparison, grid, and chart content', async () => {
		seedPopulatedCurrencyState();

		await renderDashboard();

		const pageText = getText();

		expect(pageText).toContain('US Dollar');
		expect(pageText).toContain(`${RatesGridDefaultOptions.CURRENCY_ABBREVIATION} rate movement`);
		expect(pageText).toContain(`How ${RatesGridDefaultOptions.CURRENCY_ABBREVIATION} performs against peers`);
		expect(pageText).toContain('Daily board and quick actions');
		expect(pageText).toContain('Latest official rates');
		expect(pageText).toContain('US Dollar [USD]');
		expect(pageText).toContain('Euro [EUR]');
		expect(component.selectedCurrencySignal()?.currencyId).toBe(RatesGridDefaultOptions.CURRENCY_ID);
	});

	it('should update dashboard and chart focus when the grid selected currency changes', async () => {
		seedPopulatedCurrencyState();
		await renderDashboard();

		getRowCheckboxInputs()[1].click();
		await fixture.whenStable();
		fixture.detectChanges();

		const tableOptionsStore = store.selectSnapshot<ICurrencyTableStateModel>(
			(state: CurrencyRatesDashboardTestState) => state.currencyState.currencyTableState
		);

		expect(tableOptionsStore.tableOptions.selectedItem.currencyId).toBe(451);
		expect(tableOptionsStore.tableOptions.selectedItem.abbreviation).toBe('EUR');
		expect(component.selectedCurrencySignal()?.abbreviation).toBe('EUR');
		expect(getText()).toContain('EUR selected');
		expect(getText()).toContain('EUR rate movement');
		expect(getText()).toContain('How EUR performs against peers');
	});

	it('should preserve empty-data rendering without comparison cards', async () => {
		currencyRateProviderSpy.getTodayCurrencies.and.returnValue(of([]));
		currencyRateProviderSpy.getCurrencies.and.returnValue(of([]));
		store.dispatch(new SetCurrencyDateRange(1, selectedRangeEnd));

		await renderDashboard();

		expect(component.currencyComparisonsSignal()).toEqual([]);
		expect(getNativeElement().querySelector('.rates-comparison')).toBeNull();
		expect(getNativeElement().querySelector('app-currency-rates-grid')).not.toBeNull();
		expect(getNativeElement().querySelector('currency-rates-line-chart')).not.toBeNull();
		expect(getText()).toContain('currencies tracked');
		expect(getRenderedRows().length).toBe(0);
	});

	it('should render the grid loading overlay while today rates are loading', async () => {
		const todayRatesSubject = new Subject<CurrencyRateGroupModel[]>();
		currencyRateProviderSpy.getTodayCurrencies.and.returnValue(todayRatesSubject);
		currencyRateProviderSpy.getCurrencies.and.returnValue(of(sampleRateGroups));
		seedPopulatedCurrencyState();

		fixture.detectChanges();
		await fixture.whenStable();
		fixture.detectChanges();

		expect(getNativeElement().querySelector('.overlay progress-spinner')).not.toBeNull();

		todayRatesSubject.next(sampleRateGroups);
		todayRatesSubject.complete();
		await settleDashboard();

		expect(getNativeElement().querySelector('.overlay progress-spinner')).toBeNull();
		expect(getRenderedRows().length).toBe(2);
	});

	function seedPopulatedCurrencyState(): void {
		store.dispatch(new SetCurrencyDateRange(1, selectedRangeEnd));
		store.dispatch(
			new SetActiveCurrency(RatesGridDefaultOptions.CURRENCY_ID, RatesGridDefaultOptions.CURRENCY_ABBREVIATION)
		);
		store.dispatch(new AddCurrencyGroups(sampleRateGroups));
	}

	async function renderDashboard(): Promise<void> {
		fixture.detectChanges();
		await settleDashboard();
		await settleDashboard();
	}

	async function settleDashboard(): Promise<void> {
		await fixture.whenStable();
		await new Promise<void>(resolve => setTimeout(resolve));
		fixture.detectChanges();
	}

	function getRowCheckboxInputs(): HTMLInputElement[] {
		return Array.from<HTMLInputElement>(getNativeElement().querySelectorAll('input[type="checkbox"]')).slice(1);
	}

	function getRenderedRows(): HTMLElement[] {
		return Array.from<HTMLElement>(getNativeElement().querySelectorAll('tbody tr'));
	}

	function getText(): string {
		return getNativeElement().textContent ?? '';
	}

	function getNativeElement(): HTMLElement {
		const nativeElement: unknown = fixture.nativeElement;

		if (!(nativeElement instanceof HTMLElement)) {
			throw new Error('Expected the component fixture to render an HTMLElement.');
		}

		return nativeElement;
	}
});
