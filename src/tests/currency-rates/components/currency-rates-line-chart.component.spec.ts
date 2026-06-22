import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NgxsModule, Store } from '@ngxs/store';
import { of } from 'rxjs';

import { ngxsConfig } from '../../../app/modules/shared/store/ngxs.config';
import {
	SetActiveCurrency,
	SetCurrencyDateRange,
} from '../../../app/modules/shared/store/states/rates/actions/currency-table-options.actions';
import { AddCurrencyGroups } from '../../../app/modules/shared/store/states/rates/actions/currency.actions';
import { CurrencyChartState } from '../../../app/modules/shared/store/states/rates/currency-chart.state';
import { CurrencyRatesState } from '../../../app/modules/shared/store/states/rates/currency-rates.state';
import { CurrencyTableState } from '../../../app/modules/shared/store/states/rates/currency-table.state';
import { NationalBankCurrenciesProvider } from '../../../data/providers/rates/national-bank-currencies.provider';
import { CurrencyRateValueModel } from '../../../domain/models/rates/currency-rate-value.model';
import { CurrencyRateGroupModel } from '../../../domain/models/rates/currency-rates-group.model';
import { CurrencyRatesLineChartComponent } from '../../../presentation/currency-rates/components/currency-rates-line-chart/currency-rates-line-chart.component';
import { LineChartService } from '../../../presentation/currency-rates/services/line-chart.service';

describe('currency rates line chart component', () => {
	let sut: CurrencyRatesLineChartComponent;
	let fixture: ComponentFixture<CurrencyRatesLineChartComponent>;

	let store: Store;
	let currencyRateProviderSpy: jasmine.SpyObj<NationalBankCurrenciesProvider>;

	const updatedCurrencyRateGroups = [
		new CurrencyRateGroupModel({
			currencyId: 12,
			name: 'currency-a',
			abbreviation: 'cur-a',
			scale: 1,
			rateValues: [
				new CurrencyRateValueModel({
					ratePerUnit: 17,
					updateDate: new Date(2022, 1, 3),
				}),
				new CurrencyRateValueModel({
					ratePerUnit: 8,
					updateDate: new Date(2022, 2, 3),
				}),
			],
		}),
	];

	beforeEach(async () => {
		currencyRateProviderSpy = jasmine.createSpyObj<NationalBankCurrenciesProvider>('currencyRatesProvider', {
			getTodayCurrencies: of<CurrencyRateGroupModel[]>([
				new CurrencyRateGroupModel({
					currencyId: 1,
					name: 'currency-a',
					abbreviation: 'cur-a',
					scale: 1,
					rateValues: [new CurrencyRateValueModel({})],
				}),
			]),
			getCurrencies: of<CurrencyRateGroupModel[]>([]),
			getCurrenciesForSpecifiedPeriod: undefined,
			saveCurrencies: undefined,
		});

		await TestBed.configureTestingModule({
			imports: [
				CurrencyRatesLineChartComponent,
				NgxsModule.forRoot([CurrencyRatesState, CurrencyTableState, CurrencyChartState], ngxsConfig),
			],
			providers: [
				LineChartService,
				{
					provide: NationalBankCurrenciesProvider,
					useValue: currencyRateProviderSpy,
				},
			],
		}).compileComponents();

		fixture = TestBed.createComponent(CurrencyRatesLineChartComponent);
		sut = fixture.componentInstance;
		store = TestBed.inject(Store);
	});

	it('should create the standalone component and compile its template', () => {
		fixture.detectChanges();

		const element = fixture.nativeElement as HTMLElement;

		expect(sut).toBeTruthy();
		expect(currencyRateProviderSpy.getCurrencies.calls.any()).toBeTrue();
		expect(element.querySelector('progress-spinner')).not.toBeNull();
		expect(element.querySelector('apx-chart')).toBeNull();
	});

	it('should keep the chart empty until currency rate data is available', () => {
		fixture.detectChanges();
		store.dispatch(new AddCurrencyGroups(updatedCurrencyRateGroups));
		store.dispatch(new SetCurrencyDateRange(48, new Date(2024, 3, 10)));
		store.dispatch(new SetActiveCurrency(999, 'missing'));

		fixture.detectChanges();

		const element = fixture.nativeElement as HTMLElement;

		expect(sut.isChartInitialized$.value).toBe(false);
		expect(sut.chartOptions.series).toBeUndefined();
		expect(element.querySelector('apx-chart')).toBeNull();
	});

	it('should initialize chart options from currency rate data changes', () => {
		const lineChartService = TestBed.inject(LineChartService);
		const getChartOptionsSpy = spyOn(lineChartService, 'getChartOptions').and.callThrough();

		fixture.detectChanges();
		store.dispatch(new SetCurrencyDateRange(48, new Date(2024, 3, 10)));
		store.dispatch(new SetActiveCurrency(12, 'cur-a'));
		store.dispatch(new AddCurrencyGroups(updatedCurrencyRateGroups));
		fixture.detectChanges();

		const element = fixture.nativeElement as HTMLElement;

		expect(sut.isChartInitialized$.value).toBe(true);
		expect(getChartOptionsSpy).toHaveBeenCalled();
		expect(sut.chartOptions.series?.[0].name).toBe('cur-a');
		expect(sut.chartOptions.series?.[0].data).toEqual([17, 8]);
		expect(sut.chartOptions.chart?.type).toBe('area');
		expect(sut.chartOptions.chart?.height).toBe('380');
		expect(sut.chartOptions.chart?.width).toBe('100%');
		expect(sut.chartOptions.xaxis?.categories).toEqual(['03 Feb 22', '03 Mar 22']);
		expect(sut.chartOptions.yaxis?.min).toBe(8);
		expect(sut.chartOptions.yaxis?.max).toBe(17);
		expect(element.querySelector('apx-chart')).not.toBeNull();
	});
});
