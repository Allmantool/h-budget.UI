/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { TestBed } from '@angular/core/testing';

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

	let store: Store;
	let currencyRateProviderSpy: jasmine.SpyObj<NationalBankCurrenciesProvider>;

	beforeEach(() => {
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
			getCurrencies: undefined,
			getCurrenciesForSpecifiedPeriod: undefined,
			saveCurrencies: undefined,
		});

		// eslint-disable-next-line @typescript-eslint/no-floating-promises
		TestBed.configureTestingModule({
			imports: [NgxsModule.forRoot([CurrencyRatesState, CurrencyTableState, CurrencyChartState], ngxsConfig)],
			providers: [
				CurrencyRatesLineChartComponent,
				LineChartService,
				{
					provide: NationalBankCurrenciesProvider,
					useValue: currencyRateProviderSpy,
				},
			],
		}).compileComponents();

		sut = TestBed.inject(CurrencyRatesLineChartComponent);
		store = TestBed.inject(Store);
	});

	it('should be initialized CurrencyRatesLineChartComponent with "ngAfterViewInit"', (done: DoneFn) => {
		const updatedCurrencyRateGroups = new Array({
			currencyId: 12,
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
		} as CurrencyRateGroupModel);

		store.dispatch(new AddCurrencyGroups(updatedCurrencyRateGroups));
		store.dispatch(new SetCurrencyDateRange(48, new Date(2024, 3, 10)));
		store.dispatch(new SetActiveCurrency(12, 'cur-a'));

		sut.ngAfterViewInit();

		expect(sut.isChartInitialized$.value).toBe(true);

		done();
	});
});
