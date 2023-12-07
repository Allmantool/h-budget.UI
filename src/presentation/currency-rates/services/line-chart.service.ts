/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';

import * as _ from 'lodash';

import { Select, Store } from '@ngxs/store';
import { format } from 'date-fns';
import { ChartComponent } from 'ng-apexcharts';
import { Observable } from 'rxjs';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';

import { LineChartTitleService } from './line-chart-title.service';
import { CurrencyChartOptions } from '../../../app/modules/shared/store/models/currency-rates/currency-chart-option.';
import { CurrencyTableOptions } from '../../../app/modules/shared/store/models/currency-rates/currency-table-options';
import { getCurrencyChartOptions } from '../../../app/modules/shared/store/states/rates/selectors/currency-chart-options.selectors';
import { getCurrencyTableOptions } from '../../../app/modules/shared/store/states/rates/selectors/currency-table-options.selectors';
import { CurrencyRateValueModel } from '../../../domain/models/rates/currency-rate-value.model';
import { ChartOptions } from '../models/chart-options';
import { LineChartOptions } from '../models/line-chart-options';

@Injectable()
export class LineChartService {
	public tableOptionsSignal: Signal<CurrencyTableOptions>;
	public currencyChartOptionSignal: Signal<CurrencyChartOptions>;

	@Select(getCurrencyTableOptions)
	public currencyTableOptions$!: Observable<CurrencyTableOptions>;

	@Select(getCurrencyChartOptions)
	currencyChartOptions$!: Observable<CurrencyChartOptions>;

	constructor(protected readonly store: Store) {
		this.tableOptionsSignal = toSignal(this.currencyTableOptions$, { initialValue: {} as CurrencyTableOptions });
		this.currencyChartOptionSignal = toSignal(this.currencyChartOptions$, {
			initialValue: {} as CurrencyChartOptions,
		});
	}

	private charOptions$ = new BehaviorSubject({} as ChartOptions);

	public getChartOptions(
		rates: CurrencyRateValueModel[],
		chartComponentRef: ChartComponent,
		options: LineChartOptions
	): ChartOptions {
		const selectedDateRange = this.tableOptionsSignal().selectedDateRange;

		const ratesForPeriod = _.chain(rates)
			.sortBy(i => i.updateDate)
			.filter(r => r.updateDate! >= selectedDateRange.start && r.updateDate! <= selectedDateRange.end)
			.value();

		const rateValueSeriesData = _.map(ratesForPeriod, r => r.ratePerUnit ?? 0);
		const rateValueLabels = _.map(ratesForPeriod, r => format(r.updateDate!, options.dateFormat));

		this.charOptions$.next({
			series: [
				{
					name: this.tableOptionsSignal().selectedItem.abbreviation,
					data: rateValueSeriesData,
				},
			],
			chart: {
				id: 'currency-line-chart',
				events: {
					zoomed: (chartContext, { xaxis }) => {
						const dataPyaload: number[] = LineChartService.getRatesFromChartContext(chartContext);
						const zoomedData = _.slice(dataPyaload, xaxis.min - 1, xaxis.max);

						const chartTitle = LineChartTitleService.calculateTitle(
							this.tableOptionsSignal().selectedItem.abbreviation,
							zoomedData
						);

						const trendTitle = this.currencyChartOptionSignal().activeCurrencyTrendTitle;

						if (!_.isEqual(trendTitle, chartTitle.text)) {
							chartComponentRef.updateOptions({
								title: {
									text: chartTitle.text,
									style: chartTitle.style,
								},
							});
						}
					},
				},
				height: options.height,
				width: options.width,
				type: options.type,
			},
			title: {},
			xaxis: {
				categories: rateValueLabels,
			},
		});

		return this.charOptions$.value;
	}

	private static getRatesFromChartContext(chartContext: any): number[] {
		return chartContext.series.ctx.series.w.globals.series[0];
	}
}
