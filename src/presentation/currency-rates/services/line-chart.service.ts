/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable } from '@angular/core';

import { format } from 'date-fns';
import * as _ from 'lodash';
import { Store } from '@ngxs/store';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';

import { LineChartOptions } from '../models/line-chart-options';
import { CurrencyTableOptions } from 'app/modules/shared/store/models/currency-rates/currency-table-options';
import { CurrencyRateValueModel } from 'domain/models/rates/currency-rate-value.model';
import { SetActiveCurrencyTrendTitle } from '../../../app/modules/shared/store/states/rates/actions/currency-chart-options.actions';
import { LineChartTitleService } from './line-chart-title.service';
import { CurrencyChartTitle } from '../../../app/modules/shared/store/models/currency-rates/currency-chart-title';
import { ChartOptions } from '../models/chart-options';

@Injectable()
export class LineChartService {
	constructor(protected readonly store: Store) {
		this.chartCurrencyTrendTitle$.subscribe((p) => {
			const updatedState = { ...this.charOptions$.value, title: p };

			this.charOptions$.next(updatedState);
		});
	}

	private chartCurrencyTrendTitle$ = new BehaviorSubject({} as CurrencyChartTitle);

	private charOptions$ = new BehaviorSubject({} as ChartOptions);

	public getChartOptions(
		rates: CurrencyRateValueModel[],
		tableOptions: CurrencyTableOptions,
		options: LineChartOptions
	): ChartOptions {
		const ratesFilterByDateRange = _.sortBy(rates, (i) => i.updateDate);

		const selectedDateRange = tableOptions.selectedDateRange;

		const ratesForPeriod = _.filter(
			ratesFilterByDateRange,
			(r) =>
				r.updateDate! >= selectedDateRange.start && r.updateDate! <= selectedDateRange.end
		);

		const abbreviation = tableOptions.selectedItem.abbreviation;

		this.chartCurrencyTrendTitle$.next(
			LineChartTitleService.calculateTitle(
				abbreviation,
				_.map(ratesForPeriod, (r) => r.ratePerUnit!)
			)
		);

		this.charOptions$.next({
			series: [
				{
					name: abbreviation,
					data: _.map(ratesForPeriod, (r) => r.ratePerUnit ?? 0),
				},
			],
			chart: {
				events: {
					zoomed: (chartContext, { xaxis }) => {
						const dataPyaload: number[] =
							LineChartService.getRatesFromChartContext(chartContext);

						const zoomedData = _.slice(dataPyaload, xaxis.min - 1, xaxis.max);

						this.chartCurrencyTrendTitle$.next(
							LineChartTitleService.calculateTitle(abbreviation, zoomedData)
						);

						this.store.dispatch(
							new SetActiveCurrencyTrendTitle(
								this.chartCurrencyTrendTitle$.value.text
							)
						);
					},
				},
				height: options.height,
				width: options.width,
				type: options.type,
			},
			title: this.chartCurrencyTrendTitle$.value,
			xaxis: {
				categories: _.map(ratesForPeriod, (r) => format(r.updateDate!, options.dateFormat)),
			},
		});

		return this.charOptions$.value;
	}

	private static getRatesFromChartContext(chartContext: any): number[] {
		return chartContext.series.ctx.series.w.globals.series[0];
	}
}
