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
import { LTTB } from 'downsample';
import { Observable } from 'rxjs';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';

import { LineChartTitleService } from './line-chart-title.service';
import { ICurrencyChartOptions } from '../../../app/modules/shared/store/models/currency-rates/currency-chart-option.';
import { ICurrencyChartTitle } from '../../../app/modules/shared/store/models/currency-rates/currency-chart-title';
import { ICurrencyTableOptions } from '../../../app/modules/shared/store/models/currency-rates/currency-table-options';
import { getCurrencyChartOptions } from '../../../app/modules/shared/store/states/rates/selectors/currency-chart-options.selectors';
import { getCurrencyTableOptions } from '../../../app/modules/shared/store/states/rates/selectors/currency-table-options.selectors';
import { CurrencyRateValueModel } from '../../../domain/models/rates/currency-rate-value.model';
import { ChartOptions } from '../models/chart-options';
import { LineChartOptions } from '../models/line-chart-options';
import { DataPoint } from '../types/data-point.type';

@Injectable()
export class LineChartService {
	private maxRatesAmount: number = 70;
	public tableOptionsSignal: Signal<ICurrencyTableOptions>;
	public currencyChartOptionSignal: Signal<ICurrencyChartOptions>;

	@Select(getCurrencyTableOptions)
	public currencyTableOptions$!: Observable<ICurrencyTableOptions>;

	@Select(getCurrencyChartOptions)
	currencyChartOptions$!: Observable<ICurrencyChartOptions>;

	constructor(protected readonly store: Store) {
		this.tableOptionsSignal = toSignal(this.currencyTableOptions$, { initialValue: {} as ICurrencyTableOptions });
		this.currencyChartOptionSignal = toSignal(this.currencyChartOptions$, {
			initialValue: {} as ICurrencyChartOptions,
		});
	}

	private charOptions$ = new BehaviorSubject({} as ChartOptions);

	public getChartOptions(
		rates: CurrencyRateValueModel[],
		options: LineChartOptions,
		onZoomedCallback?: (title: ICurrencyChartTitle) => void
	): ChartOptions {
		const selectedDateRange = this.tableOptionsSignal().selectedDateRange;

		const ratesForPeriod = _.chain(rates)
			.sortBy(i => i.updateDate)
			.filter(r => r.updateDate! >= selectedDateRange.start && r.updateDate! <= selectedDateRange.end)
			.value();

		const ratesDataPoints = ratesForPeriod.map(d => <DataPoint>[d.updateDate, d.officialRate]);
		const downSampleRates = _.map(LTTB(ratesDataPoints, this.maxRatesAmount), d =>
			new CurrencyRateValueModel().fromDataPoint(<DataPoint>d)
		);

		const rateValueSeriesData = _.map(downSampleRates, r => r.ratePerUnit ?? 0);
		const rateValueLabels = _.map(downSampleRates, r => format(r.updateDate!, options.dateFormat));
		const defaultTitle = LineChartTitleService.calculateTitle(
			this.tableOptionsSignal().selectedItem.abbreviation,
			rateValueSeriesData
		);

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
						const dataPayload: number[] = LineChartService.getRatesFromChartContext(chartContext);
						const zoomedData = _.slice(dataPayload, xaxis.min - 1, xaxis.max);

						const chartTitle = LineChartTitleService.calculateTitle(
							this.tableOptionsSignal().selectedItem.abbreviation,
							zoomedData
						);

						const trendTitle = this.currencyChartOptionSignal().activeCurrencyTrendTitle;

						if (!_.isEqual(trendTitle, chartTitle.text) && !_.isNil(onZoomedCallback)) {
							onZoomedCallback(chartTitle);
						}
					},
				},
				height: options.height,
				width: options.width,
				type: options.type,
			},
			title: defaultTitle,
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
