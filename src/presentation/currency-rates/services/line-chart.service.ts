/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import { Injectable, Signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';

import * as _ from 'lodash';

import { Select, Store } from '@ngxs/store';
import { format } from 'date-fns';
import { ChartComponent } from 'ng-apexcharts';
import { filter, Observable } from 'rxjs';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';

import { LineChartTitleService } from './line-chart-title.service';
import { CurrencyChartOptions } from '../../../app/modules/shared/store/models/currency-rates/currency-chart-option.';
import { CurrencyChartTitle } from '../../../app/modules/shared/store/models/currency-rates/currency-chart-title';
import { CurrencyTableOptions } from '../../../app/modules/shared/store/models/currency-rates/currency-table-options';
import { SetActiveCurrencyTrendTitle } from '../../../app/modules/shared/store/states/rates/actions/currency-chart-options.actions';
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
		this.chartCurrencyTrendTitle$.pipe(takeUntilDestroyed()).subscribe(p => {
			const updatedState = { ...this.charOptions$.value, title: p };

			this.charOptions$.next(updatedState);
		});

		this.tableOptionsSignal = toSignal(this.currencyTableOptions$, { initialValue: {} as CurrencyTableOptions });
		this.currencyChartOptionSignal = toSignal(this.currencyChartOptions$, {
			initialValue: {} as CurrencyChartOptions,
		});
	}

	private chartCurrencyTrendTitle$ = new BehaviorSubject({} as CurrencyChartTitle);

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

		this.charOptions$.next({
			series: [
				{
					name: this.tableOptionsSignal().selectedItem.abbreviation,
					data: rateValueSeriesData,
				},
			],
			chart: {
				id: 'mock-id',
				events: {
					zoomed: (chartContext, { xaxis }) => {
						const dataPyaload: number[] = LineChartService.getRatesFromChartContext(chartContext);
						const zoomedData = _.slice(dataPyaload, xaxis.min - 1, xaxis.max);

						if (dataPyaload.length === zoomedData.length) {
							this.updateChartTitle(rateValueSeriesData, chartComponentRef);
							return;
						}

						const updatedSeries = { ...this.charOptions$.value.series, data: zoomedData };

						this.charOptions$.next({
							...this.charOptions$.value,
							series: updatedSeries,
						});

						this.updateChartTitle(zoomedData, chartComponentRef);
					},
				},
				height: options.height,
				width: options.width,
				type: options.type,
			},
			title: this.chartCurrencyTrendTitle$.value,
			xaxis: {
				categories: _.map(ratesForPeriod, r => format(r.updateDate!, options.dateFormat)),
			},
		});

		this.updateChartTitle(rateValueSeriesData, chartComponentRef);

		return this.charOptions$.value;
	}

	private updateChartTitle(rates: number[], chartComponentRef: ChartComponent) {
		const chartTitle = LineChartTitleService.calculateTitle(
			this.tableOptionsSignal().selectedItem.abbreviation,
			rates
		);

		const fromSignal = this.currencyChartOptionSignal().activeCurrencyTrendTitle;

		if (!_.isEqual(fromSignal, chartTitle.text)) {
			this.chartCurrencyTrendTitle$.next(chartTitle);
			this.store.dispatch(new SetActiveCurrencyTrendTitle(chartTitle.text));

			chartComponentRef.updateOptions({
				series: [
					{
						data: rates,
					},
				],
				title: {
					text: chartTitle.text,
					style: chartTitle.style,
				},
			});
		}
	}

	private static getRatesFromChartContext(chartContext: any): number[] {
		return chartContext.series.ctx.series.w.globals.series[0];
	}
}
