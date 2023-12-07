import { TestBed } from '@angular/core/testing';

import { NgxsModule, Store } from '@ngxs/store';

import { ngxsConfig } from '../../../app/modules/shared/store/ngxs.config';
import {
	SetActiveCurrency,
	SetCurrencyDateRange,
} from '../../../app/modules/shared/store/states/rates/actions/currency-table-options.actions';
import { CurrencyChartState } from '../../../app/modules/shared/store/states/rates/currency-chart.state';
import { CurrencyTableState } from '../../../app/modules/shared/store/states/rates/currency-table.state';
import { CurrencyRateValueModel } from '../../../domain/models/rates/currency-rate-value.model';
import { LineChartOptions } from '../../../presentation/currency-rates/models/line-chart-options';
import { LineChartService } from '../../../presentation/currency-rates/services/line-chart.service';
describe('Line chart service', () => {
	let sut: LineChartService;
	let store: Store;

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [NgxsModule.forRoot([CurrencyTableState, CurrencyChartState], ngxsConfig)],
			providers: [LineChartService],
		});

		sut = TestBed.inject(LineChartService);
		store = TestBed.inject(Store);
	});

	it('Should return appropriate ordered serias of currency chart values by "getChartOptions"', (done: DoneFn) => {
		const rates: CurrencyRateValueModel[] = [
			new CurrencyRateValueModel({
				ratePerUnit: 1.12,
				officialRate: 11.2,
				updateDate: new Date(2024, 0, 11),
			}),
			new CurrencyRateValueModel({
				ratePerUnit: 2.32,
				officialRate: 2.32,
				updateDate: new Date(2024, 1, 12),
			}),
			new CurrencyRateValueModel({
				ratePerUnit: 3.3,
				officialRate: 3.3,
				updateDate: new Date(2024, 0, 10),
			}),
		];

		const options: LineChartOptions = new LineChartOptions({
			height: 12,
			width: 15,
		});

		store.dispatch(new SetCurrencyDateRange(3, new Date(2024, 3, 10)));
		store.dispatch(new SetActiveCurrency(11, 'cur-a'));

		const chartOptions = sut.getChartOptions(rates, options);

		const chartDataMainSeries = chartOptions.series[0];

		expect(chartDataMainSeries.data).toEqual([3.3, 1.12, 2.32]);
		done();
	});

	it('Should calculate expected negative chart currency trend title for period by "getChartOptions"', (done: DoneFn) => {
		const rates: CurrencyRateValueModel[] = [
			new CurrencyRateValueModel({
				ratePerUnit: 1.12,
				officialRate: 11.2,
				updateDate: new Date(2024, 0, 11),
			}),
			new CurrencyRateValueModel({
				ratePerUnit: 2.32,
				officialRate: 2.32,
				updateDate: new Date(2024, 1, 12),
			}),
			new CurrencyRateValueModel({
				ratePerUnit: 3.3,
				officialRate: 3.3,
				updateDate: new Date(2024, 0, 10),
			}),
		];

		const options: LineChartOptions = new LineChartOptions({
			height: 12,
			width: 15,
		});

		store.dispatch(new SetCurrencyDateRange(3, new Date(2024, 3, 10)));
		store.dispatch(new SetActiveCurrency(11, 'cur-a'));

		const chartOptions = sut.getChartOptions(rates, options);

		expect(chartOptions.title.text).toBe('cur-a ↓ (-29.697 %)');
		done();
	});

	it('Should calculate expected positive chart currency trend title for period by "getChartOptions"', (done: DoneFn) => {
		const rates: CurrencyRateValueModel[] = [
			new CurrencyRateValueModel({
				ratePerUnit: 1.12,
				officialRate: 11.2,
				updateDate: new Date(2023, 0, 11),
			}),
			new CurrencyRateValueModel({
				ratePerUnit: 3.3,
				officialRate: 3.3,
				updateDate: new Date(2024, 0, 10),
			}),
		];

		const options: LineChartOptions = new LineChartOptions({
			height: 12,
			width: 15,
		});

		store.dispatch(new SetCurrencyDateRange(48, new Date(2024, 3, 10)));
		store.dispatch(new SetActiveCurrency(11, 'cur-a'));

		const chartOptions = sut.getChartOptions(rates, options);

		expect(chartOptions.title.text).toBe('cur-a ↑ (+194.643 %)');
		done();
	});

	it('Should calculate expected no a change for chart currency trend title for period by "getChartOptions"', (done: DoneFn) => {
		const rates: CurrencyRateValueModel[] = [
			new CurrencyRateValueModel({
				ratePerUnit: 1.12,
				officialRate: 11.2,
				updateDate: new Date(2023, 0, 11),
			}),
			new CurrencyRateValueModel({
				ratePerUnit: 1.12,
				officialRate: 1.12,
				updateDate: new Date(2024, 0, 10),
			}),
		];

		const options: LineChartOptions = new LineChartOptions({
			height: 12,
			width: 15,
		});

		store.dispatch(new SetCurrencyDateRange(48, new Date(2024, 3, 10)));
		store.dispatch(new SetActiveCurrency(11, 'cur-a'));

		const chartOptions = sut.getChartOptions(rates, options);

		expect(chartOptions.title.text).toBe('cur-a');
		done();
	});
});
