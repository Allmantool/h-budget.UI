import { DatePipe, SlicePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, OnInit, Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatCardModule } from '@angular/material/card';
import { Title } from '@angular/platform-browser';

import * as _ from 'lodash';

import { Select, Store } from '@ngxs/store';
import { NgApexchartsModule } from 'ng-apexcharts';
import { Observable } from 'rxjs';

import { ICurrencyTableOptions } from '../../../../app/modules/shared/store/models/currency-rates/currency-table-options';
import {
	EnsurePersistedCurrencyRatesLoaded,
	FetchTodayCurrencyRates,
} from '../../../../app/modules/shared/store/states/rates/actions/currency.actions';
import { getCurrencyTableOptions } from '../../../../app/modules/shared/store/states/rates/selectors/currency-table-options.selectors';
import { getRates } from '../../../../app/modules/shared/store/states/rates/selectors/currency.selectors';
import { CurrencyRateValueModel } from '../../../../domain/models/rates/currency-rate-value.model';
import { CurrencyRateGroupModel } from '../../../../domain/models/rates/currency-rates-group.model';
import { CurrencyRatesGridComponent } from '../currency-rates-grid/currency-rates-grid.component';
import { CurrencyRatesLineChartComponent } from '../currency-rates-line-chart/currency-rates-line-chart.component';
import { MarketShareChartOptions } from 'presentation/currency-rates/types/market-share-chart.options';
import { TrendBarChartOptions } from 'presentation/currency-rates/types/trend-bar-chart.options';

interface CurrencyTrendComparison {
	currencyId: number;
	abbreviation: string;
	name: string;
	trend: number;
	latestRate?: number;
}

interface CrossRatePoint {
	updateDate: Date;
	rate: number;
}

@Component({
	selector: 'currency-rates-dashboard.component',
	templateUrl: './currency-rates-dashboard.component.html',
	styleUrls: ['./currency-rates-dashboard.component.css'],
	changeDetection: ChangeDetectionStrategy.OnPush,
	standalone: true,
	imports: [
		DatePipe,
		SlicePipe,
		MatCardModule,
		NgApexchartsModule,
		CurrencyRatesGridComponent,
		CurrencyRatesLineChartComponent,
	],
})
export class CurrencyRatesDashboardComponent implements OnInit {
	@Select(getCurrencyTableOptions)
	public currencyTableOptions$!: Observable<ICurrencyTableOptions>;

	@Select(getRates)
	public rateGroups$!: Observable<CurrencyRateGroupModel[]>;

	public readonly tableOptionsSignal: Signal<ICurrencyTableOptions>;

	public readonly rateGroupsSignal: Signal<CurrencyRateGroupModel[]>;

	public readonly selectedCurrencySignal = computed(() => {
		const { currencyId } = this.tableOptionsSignal().selectedItem ?? {};

		return this.rateGroupsSignal().find(rateGroup => rateGroup.currencyId === currencyId);
	});

	public readonly selectedRateSignal = computed(() => {
		const selectedCurrency = this.selectedCurrencySignal();

		return _.maxBy(
			selectedCurrency?.rateValues ?? [],
			(rateValue: CurrencyRateValueModel) => rateValue.updateDate?.getTime() ?? 0
		);
	});

	public readonly latestRefreshSignal = computed(() => {
		return _.max(
			this.rateGroupsSignal().flatMap(rateGroup =>
				(rateGroup.rateValues ?? []).map(
					(rateValue: CurrencyRateValueModel) => rateValue.updateDate?.getTime() ?? 0
				)
			)
		);
	});

	public readonly currencyComparisonsSignal = computed(() => {
		const selectedDateRange = this.tableOptionsSignal().selectedDateRange;
		const activeCurrencyId = this.tableOptionsSignal().selectedItem.currencyId;
		const activeCurrencyGroup = this.rateGroupsSignal().find(
			rateGroup => rateGroup.currencyId === activeCurrencyId
		);
		const activeRatesInRange = _.chain(activeCurrencyGroup?.rateValues ?? [])
			.filter(
				(rateValue: CurrencyRateValueModel) =>
					!!rateValue.updateDate &&
					rateValue.updateDate >= selectedDateRange.start &&
					rateValue.updateDate <= selectedDateRange.end
			)
			.sortBy(rateValue => rateValue.updateDate?.getTime() ?? 0)
			.value();

		const activeRatesMap = new Map(
			activeRatesInRange.map(rateValue => [
				rateValue.updateDate!.toISOString().slice(0, 10),
				rateValue.ratePerUnit ?? 0,
			])
		);

		if (_.isEmpty(activeRatesInRange)) {
			return [];
		}

		return this.rateGroupsSignal()
			.map((rateGroup): CurrencyTrendComparison | null => {
				const ratesInRange = _.chain(rateGroup.rateValues ?? [])
					.filter(
						(rateValue: CurrencyRateValueModel) =>
							!!rateValue.updateDate &&
							rateValue.updateDate >= selectedDateRange.start &&
							rateValue.updateDate <= selectedDateRange.end
					)
					.sortBy(rateValue => rateValue.updateDate?.getTime() ?? 0)
					.value();

				const crossRates = ratesInRange
					.map(rateValue => {
						const updateKey = rateValue.updateDate!.toISOString().slice(0, 10);
						const activeRate = activeRatesMap.get(updateKey);
						const currentRate = rateValue.ratePerUnit;

						if (_.isNil(activeRate) || _.isNil(currentRate) || activeRate === 0) {
							return null;
						}

						return {
							updateDate: rateValue.updateDate!,
							rate: _.round(currentRate / activeRate, 6),
						};
					})
					.filter((point): point is CrossRatePoint => !_.isNil(point));

				if (rateGroup.currencyId === activeCurrencyId) {
					const latestRatePoint = _.last(activeRatesInRange);

					return {
						currencyId: rateGroup.currencyId ?? 0,
						abbreviation: rateGroup.abbreviation ?? '',
						name: rateGroup.name ?? 'Unknown currency',
						trend: 0,
						latestRate: latestRatePoint ? 1 : undefined,
					};
				}

				const firstRate = _.first(crossRates)?.rate;
				const lastRate = _.last(crossRates)?.rate;

				if (_.isNil(firstRate) || _.isNil(lastRate) || firstRate === 0) {
					return null;
				}

				return {
					currencyId: rateGroup.currencyId ?? 0,
					abbreviation: rateGroup.abbreviation ?? '',
					name: rateGroup.name ?? 'Unknown currency',
					trend: _.round(((lastRate - firstRate) / firstRate) * 100, 3),
					latestRate: lastRate,
				};
			})
			.filter((comparison): comparison is CurrencyTrendComparison => !_.isNil(comparison))
			.sort((left, right) => right.trend - left.trend);
	});

	public readonly selectedCurrencyComparisonSignal = computed(() => {
		const selectedCurrencyId = this.tableOptionsSignal().selectedItem.currencyId;

		return this.currencyComparisonsSignal().find(comparison => comparison.currencyId === selectedCurrencyId);
	});

	public readonly selectedCurrencyRankSignal = computed(() => {
		const selectedCurrencyId = this.tableOptionsSignal().selectedItem.currencyId;

		return (
			this.currencyComparisonsSignal().findIndex(comparison => comparison.currencyId === selectedCurrencyId) + 1
		);
	});

	public readonly strongestCurrencySignal = computed(() => _.first(this.currencyComparisonsSignal()));

	public readonly weakestCurrencySignal = computed(() => _.last(this.currencyComparisonsSignal()));

	public readonly peerComparisonSignal = computed(() => {
		const current = this.selectedCurrencyComparisonSignal();
		const comparisons = this.currencyComparisonsSignal();
		const rank = this.selectedCurrencyRankSignal();

		if (_.isNil(current) || rank <= 0 || _.isEmpty(comparisons)) {
			return null;
		}

		return {
			outperforming: rank - 1,
			underperforming: Math.max(comparisons.length - rank, 0),
		};
	});

	public readonly trendLeaderboardChartSignal = computed<TrendBarChartOptions>(() => {
		const comparisons = this.currencyComparisonsSignal();
		const topMovers = comparisons.slice(0, 5);
		const bottomMovers = [...comparisons.slice(-3)].reverse();
		const chartItems = _.uniqBy([...topMovers, ...bottomMovers], comparison => comparison.currencyId);

		return {
			series: [
				{
					name: 'Trend %',
					data: chartItems.map(comparison => comparison.trend),
				},
			],
			chart: {
				type: 'bar',
				height: 320,
				toolbar: {
					show: false,
				},
			},
			plotOptions: {
				bar: {
					borderRadius: 6,
					horizontal: true,
					distributed: true,
					barHeight: '62%',
				},
			},
			dataLabels: {
				enabled: true,
				formatter: (value: string | number | number[]) => `${String(value)}%`,
				style: {
					fontSize: '12px',
					fontWeight: '700',
				},
			},
			xaxis: {
				categories: chartItems.map(comparison => comparison.abbreviation),
				axisBorder: {
					show: false,
				},
				axisTicks: {
					show: false,
				},
				labels: {
					formatter: (value: string | number | number[]) => `${String(value)}%`,
				},
			},
			yaxis: {
				labels: {
					style: {
						fontSize: '12px',
						fontWeight: 600,
					},
				},
			},
			grid: {
				strokeDashArray: 4,
				borderColor: 'rgba(15, 23, 42, 0.08)',
			},
			tooltip: {
				y: {
					formatter: (value: string | number | number[]) => `${String(value)}%`,
				},
			},
			fill: {
				opacity: 1,
				colors: chartItems.map(comparison =>
					comparison.currencyId === this.tableOptionsSignal().selectedItem.currencyId
						? '#0e7490'
						: comparison.trend >= 0
							? '#22c55e'
							: '#ef4444'
				),
			},
		};
	});

	public readonly marketPositionChartSignal = computed<MarketShareChartOptions>(() => {
		const peerComparison = this.peerComparisonSignal();

		return {
			series: [peerComparison?.outperforming ?? 0, peerComparison?.underperforming ?? 0],
			chart: {
				type: 'donut',
				height: 320,
			},
			labels: ['Behind active', 'Ahead of active'],
			legend: {
				position: 'bottom',
			},
			plotOptions: {
				pie: {
					donut: {
						size: '68%',
						labels: {
							show: true,
							total: {
								show: true,
								label: this.tableOptionsSignal().selectedItem.abbreviation,
								formatter: () => `#${this.selectedCurrencyRankSignal()}`,
							},
						},
					},
				},
			},
			stroke: {
				width: 0,
			},
			fill: {
				colors: ['#0f766e', '#dbe4ee'],
			},
			tooltip: {
				y: {
					formatter: (value: string | number | number[]) => `${String(value)} currencies`,
				},
			},
			responsive: [
				{
					breakpoint: 768,
					options: {
						chart: {
							height: 260,
						},
						legend: {
							position: 'bottom',
						},
					},
				},
			],
		};
	});

	constructor(
		private readonly title: Title,
		private readonly store: Store
	) {
		this.tableOptionsSignal = toSignal(this.currencyTableOptions$, {
			initialValue: {
				selectedItem: {
					currencyId: 0,
					abbreviation: 'USD',
				},
				selectedDateRange: {
					start: new Date(),
					end: new Date(),
					diffInMonths: 0,
				},
			},
		});

		this.rateGroupsSignal = toSignal(this.rateGroups$, {
			initialValue: [],
		});
	}

	ngOnInit(): void {
		this.title.setTitle('H-Budget rates');
		this.store.dispatch(new EnsurePersistedCurrencyRatesLoaded());
		this.store.dispatch(new FetchTodayCurrencyRates());
	}
}
