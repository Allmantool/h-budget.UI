import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogConfig } from '@angular/material/dialog';

import { MapperModule } from '@dynamic-mapper/angular';
import { NgxsModule, Store } from '@ngxs/store';
import { of, Subject } from 'rxjs';

import { DateRangeDialogComponent } from '../../../app/modules/shared/components/dialog/dates-rage/dates-range-dialog.component';
import { RatesGridDefaultOptions } from '../../../app/modules/shared/constants/rates-grid-default-options';
import { DialogContainer } from '../../../app/modules/shared/models/dialog-container';
import { DialogProvider } from '../../../app/modules/shared/providers/dialog-provider';
import { LoaderService } from '../../../app/modules/shared/services/loader-service';
import { ngxsConfig } from '../../../app/modules/shared/store/ngxs.config';
import { SetActiveCurrency } from '../../../app/modules/shared/store/states/rates/actions/currency-table-options.actions';
import { CurrencyChartState } from '../../../app/modules/shared/store/states/rates/currency-chart.state';
import { CurrencyRatesState } from '../../../app/modules/shared/store/states/rates/currency-rates.state';
import { CurrencyTableState } from '../../../app/modules/shared/store/states/rates/currency-table.state';
import { ICurrencyTableStateModel } from '../../../app/modules/shared/store/states/rates/models/currency-table-state.model';
import { DataRatesMappingProfile } from '../../../data/providers/rates/mappers/data-rates-mapping.profiler';
import { NationalBankCurrenciesProvider } from '../../../data/providers/rates/national-bank-currencies.provider';
import { DaysRangePayload } from '../../../domain/models/dates-range-payload.model';
import { CurrencyRateValueModel } from '../../../domain/models/rates/currency-rate-value.model';
import { CurrencyRateGroupModel } from '../../../domain/models/rates/currency-rates-group.model';
import { CurrencyRatesGridComponent } from '../../../presentation/currency-rates/components/currency-rates-grid/currency-rates-grid.component';
import { RatesGridColumnOptions } from '../../../presentation/currency-rates/constants/rates-grid-options';
import { PresentationRatesMappingProfile } from '../../../presentation/currency-rates/mappers/presentation-rates-mapping.profiler';
import { CurrencyRatesGridService } from '../../../presentation/currency-rates/services/currency-rates-grid.service';
import { RatesDialogService } from '../../../presentation/currency-rates/services/rates-dialog.service';

interface CurrencyRatesTestState {
	currencyState: {
		currencyTableState: ICurrencyTableStateModel;
	};
}

describe('currency rates grid component', () => {
	let fixture: ComponentFixture<CurrencyRatesGridComponent>;
	let component: CurrencyRatesGridComponent;

	let store: Store;
	let currencyRateProviderSpy: jasmine.SpyObj<NationalBankCurrenciesProvider>;
	let dialogProviderSpy: jasmine.SpyObj<DialogProvider>;

	const todayRateGroups: CurrencyRateGroupModel[] = [
		new CurrencyRateGroupModel({
			currencyId: RatesGridDefaultOptions.CURRENCY_ID,
			name: 'US Dollar',
			abbreviation: 'USD',
			scale: 1,
			rateValues: [
				new CurrencyRateValueModel({
					officialRate: 3.25,
					ratePerUnit: 3.25,
					updateDate: new Date(2024, 0, 15),
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
					officialRate: 3.55,
					ratePerUnit: 3.55,
					updateDate: new Date(2024, 0, 15),
				}),
			],
		}),
	];

	beforeEach(async () => {
		currencyRateProviderSpy = jasmine.createSpyObj<NationalBankCurrenciesProvider>('currencyRatesProvider', [
			'getTodayCurrencies',
			'getCurrenciesForSpecifiedPeriod',
			'getCurrencies',
		]);
		currencyRateProviderSpy.getTodayCurrencies.and.returnValue(of(todayRateGroups));
		currencyRateProviderSpy.getCurrenciesForSpecifiedPeriod.and.returnValue(of(todayRateGroups));
		currencyRateProviderSpy.getCurrencies.and.returnValue(of([]));

		dialogProviderSpy = jasmine.createSpyObj<DialogProvider>('dialogProvider', ['openDialog']);

		await TestBed.configureTestingModule({
			imports: [
				NgxsModule.forRoot([CurrencyRatesState, CurrencyTableState, CurrencyChartState], ngxsConfig),
				MapperModule.withProfiles([DataRatesMappingProfile, PresentationRatesMappingProfile]),
				CurrencyRatesGridComponent,
			],
			providers: [
				RatesDialogService,
				CurrencyRatesGridService,
				LoaderService,
				{
					provide: NationalBankCurrenciesProvider,
					useValue: currencyRateProviderSpy,
				},
				{ provide: DialogProvider, useValue: dialogProviderSpy },
			],
		})
			.compileComponents()
			.then(() => {
				fixture = TestBed.createComponent(CurrencyRatesGridComponent);
				component = fixture.componentInstance;
				fixture.detectChanges();
			});

		await fixture.whenStable();
		fixture.detectChanges();
		await fixture.whenStable();
		fixture.detectChanges();

		store = TestBed.inject(Store);
	});

	it('should create the component', () => {
		expect(component).toBeTruthy();
	});

	it('should compile the real template with expected table columns', () => {
		const headers = getHeaderTexts();

		expect(headers).toEqual(['', 'Id', 'Country', 'Name', 'An unit rate', 'Trend', 'Last update date']);
		expect(component.ratesGridColumnOptions.NAMES).toEqual(RatesGridColumnOptions.NAMES);
	});

	it('should render representative today rate rows', () => {
		const tableText = getTableText();

		expect(getRenderedRows().length).toBe(2);
		expect(tableText).toContain(String(RatesGridDefaultOptions.CURRENCY_ID));
		expect(tableText).toContain('US Dollar [USD]');
		expect(tableText).toContain('Euro [EUR]');
		expect(tableText).toContain('3.25');
		expect(tableText).toContain('3.55');
	});

	it('should initialize selection from the selected currency state', () => {
		const selected = component.todayRatesTableSelection.selected;
		const rowCheckboxes = getRowCheckboxInputs();

		expect(selected.length).toBe(1);
		expect(selected[0].currencyId).toBe(RatesGridDefaultOptions.CURRENCY_ID);
		expect(rowCheckboxes[0].checked).toBe(true);
		expect(rowCheckboxes[1].checked).toBe(false);
	});

	it('should keep the header checkbox disabled without all-row toggle behavior', () => {
		const headerCheckbox = getCheckboxInputs()[0];

		expect(headerCheckbox.disabled).toBe(true);
		expect(headerCheckbox.checked).toBe(false);
	});

	it('should set store with appropriate target currency settings by "masterToggle"', (done: DoneFn) => {
		const currencyIdUnderTest: number = 1;
		const currencyAbbreviationUnderTest: string = 'test currency';

		component.masterToggle(currencyIdUnderTest, currencyAbbreviationUnderTest);
		const tableOptionsStore = store.selectSnapshot<ICurrencyTableStateModel>(
			(state: CurrencyRatesTestState) => state.currencyState.currencyTableState
		);

		expect(tableOptionsStore.tableOptions.selectedItem.currencyId).toBe(currencyIdUnderTest);
		expect(tableOptionsStore.tableOptions.selectedItem.abbreviation).toBe(currencyAbbreviationUnderTest);
		done();
	});

	it('should update selected currency from an individual row checkbox', async () => {
		getRowCheckboxInputs()[1].click();
		await fixture.whenStable();
		fixture.detectChanges();

		const tableOptionsStore = store.selectSnapshot<ICurrencyTableStateModel>(
			(state: CurrencyRatesTestState) => state.currencyState.currencyTableState
		);

		expect(tableOptionsStore.tableOptions.selectedItem.currencyId).toBe(451);
		expect(tableOptionsStore.tableOptions.selectedItem.abbreviation).toBe('EUR');
		expect(component.isSelectedCurrency(451)).toBe(true);
	});

	it('should populate today currency rate groups by "getTodayCurrencyRatesAsync"', async () => {
		currencyRateProviderSpy.getTodayCurrencies.calls.reset();

		await component.getTodayCurrencyRatesAsync();

		expect(currencyRateProviderSpy.getTodayCurrencies.calls.count()).toBe(1);
		expect(component.todayRatesTableDataSource.data.length).toBe(2);
	});

	it('should reset loader state after loading today currency rates', async () => {
		const loadPromise = component.getTodayCurrencyRatesAsync();

		expect(component.loaderService.isLoading()).toBe(true);

		await loadPromise;

		expect(component.loaderService.isLoading()).toBe(false);
	});

	it('should trigger open rates dialog "openGetCurrencyRatesDialog"', () => {
		component.openGetCurrencyRatesDialog();

		const [componentRef, config] = dialogProviderSpy.openDialog.calls.mostRecent().args;

		expect(componentRef).toBe(DateRangeDialogComponent);
		expect(config).toEqual(jasmine.any(MatDialogConfig));
	});

	it('should preserve date-range dialog cancellation behavior', () => {
		const dialogConfig = openRatesDialogAndGetConfig();
		let emitted = false;

		dialogConfig.data!.onSubmit(null as unknown as DaysRangePayload).subscribe(() => {
			emitted = true;
		});

		expect(currencyRateProviderSpy.getCurrenciesForSpecifiedPeriod.calls.any()).toBe(false);
		expect(emitted).toBe(false);
	});

	it('should load dialog date-range result into the currency rates state', () => {
		const periodRateGroupsSubject = new Subject<CurrencyRateGroupModel[]>();
		const dialogConfig = openRatesDialogAndGetConfig();
		let loadedCount = 0;

		currencyRateProviderSpy.getCurrenciesForSpecifiedPeriod.and.returnValue(periodRateGroupsSubject);

		dialogConfig
			.data!.onSubmit(
				new DaysRangePayload({
					startDate: new Date(2024, 0, 1),
					endDate: new Date(2024, 0, 31),
				})
			)
			.subscribe(result => {
				loadedCount = result;
			});

		periodRateGroupsSubject.next(todayRateGroups);

		const rateGroups = store.selectSnapshot<CurrencyRateGroupModel[]>(
			(state: CurrencyRatesTestState & { currencyState: { rateGroups: CurrencyRateGroupModel[] } }) =>
				state.currencyState.rateGroups
		);

		expect(currencyRateProviderSpy.getCurrenciesForSpecifiedPeriod.calls.any()).toBe(true);
		expect(loadedCount).toBe(2);
		expect(rateGroups.length).toBe(2);
	});

	it('should go along with expected currency table options by "isSelectedCurrency"', (done: DoneFn) => {
		const currencyIdUnderTest: number = 3;

		store.dispatch(new SetActiveCurrency(currencyIdUnderTest, ''));

		expect(component.isSelectedCurrency(currencyIdUnderTest)).toBe(true);
		done();
	});

	it('should set store with appropriate target currency table settings by "setDateRange"', (done: DoneFn) => {
		const defaultMonthAmount: number = 7;

		component.setDateRange(defaultMonthAmount);
		const tableOptionsStore: ICurrencyTableStateModel = store.selectSnapshot<ICurrencyTableStateModel>(
			(state: CurrencyRatesTestState) => state.currencyState.currencyTableState
		);

		expect(tableOptionsStore.tableOptions.selectedDateRange.diffInMonths).toBe(defaultMonthAmount);
		done();
	});

	it('should render an empty table when today rates are empty', async () => {
		currencyRateProviderSpy.getTodayCurrencies.and.returnValue(of([]));

		await component.getTodayCurrencyRatesAsync();
		fixture.detectChanges();

		expect(component.todayRatesTableDataSource.data.length).toBe(0);
		expect(getRenderedRows().length).toBe(0);
	});

	function getHeaderTexts(): string[] {
		return Array.from<HTMLElement>(getNativeElement().querySelectorAll('th')).map(header =>
			(header.textContent ?? '').trim()
		);
	}

	function getTableText(): string {
		return getNativeElement().querySelector('table')?.textContent ?? '';
	}

	function getRenderedRows(): HTMLElement[] {
		return Array.from<HTMLElement>(getNativeElement().querySelectorAll('tbody tr'));
	}

	function getCheckboxInputs(): HTMLInputElement[] {
		return Array.from<HTMLInputElement>(getNativeElement().querySelectorAll('input[type="checkbox"]'));
	}

	function getRowCheckboxInputs(): HTMLInputElement[] {
		return getCheckboxInputs().slice(1);
	}

	function getNativeElement(): HTMLElement {
		const nativeElement: unknown = fixture.nativeElement;

		if (!(nativeElement instanceof HTMLElement)) {
			throw new Error('Expected the component fixture to render an HTMLElement.');
		}

		return nativeElement;
	}

	function openRatesDialogAndGetConfig(): MatDialogConfig<DialogContainer<DaysRangePayload, number>> {
		component.openGetCurrencyRatesDialog();

		return dialogProviderSpy.openDialog.calls.mostRecent().args[1] as MatDialogConfig<
			DialogContainer<DaysRangePayload, number>
		>;
	}
});
