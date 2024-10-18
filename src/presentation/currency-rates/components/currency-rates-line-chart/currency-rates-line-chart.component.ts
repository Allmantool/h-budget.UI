/* eslint-disable @typescript-eslint/no-floating-promises */
import {
	AfterViewInit,
	ChangeDetectionStrategy,
	Component,
	DestroyRef,
	inject,
	Input,
	OnInit,
	Signal,
	ViewChild,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';

import * as _ from 'lodash';

import { Select, Store } from '@ngxs/store';
import { ChartComponent } from 'ng-apexcharts';
import { BehaviorSubject, Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';

import { ICurrencyTableOptions } from '../../../../app/modules/shared/store/models/currency-rates/currency-table-options';
import { FetchAllCurrencyRates } from '../../../../app/modules/shared/store/states/rates/actions/currency.actions';
import { getCurrencyTableOptions } from '../../../../app/modules/shared/store/states/rates/selectors/currency-table-options.selectors';
import { getCurrencyRatesGroupByCurrencyId } from '../../../../app/modules/shared/store/states/rates/selectors/currency.selectors';
import { CurrencyRateGroupModel } from '../../../../domain/models/rates/currency-rates-group.model';
import { ChartOptions } from '../../models/chart-options';
import { LineChartOptions } from '../../models/line-chart-options';
import { LineChartTitleService } from '../../services/line-chart-title.service';
import { LineChartService } from '../../services/line-chart.service';

@Component({
	selector: 'currency-rates-line-chart',
	templateUrl: './currency-rates-line-chart.component.html',
	styleUrls: ['./currency-rates-line-chart.component.css'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CurrencyRatesLineChartComponent implements AfterViewInit, OnInit {
	private readonly destroyRef = inject(DestroyRef);

	public tableOptionsSignal: Signal<ICurrencyTableOptions>;

	@Select(getCurrencyRatesGroupByCurrencyId)
	public currencyRatesGroupByCurrencyId$!: Observable<(id: number) => CurrencyRateGroupModel>;

	@Select(getCurrencyTableOptions)
	public currencyTableOptions$!: Observable<ICurrencyTableOptions>;

	@ViewChild(ChartComponent, { static: false }) chart!: ChartComponent;
	public chartOptions: Partial<ChartOptions> = {};

	@Input() public chartWidth = '500%';
	@Input() public chartHeight = '360';

	public isChartInitialized$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

	private lineChartOptions: LineChartOptions;

	constructor(
		private store: Store,
		private lineChartService: LineChartService
	) {
		this.lineChartOptions = {
			height: this.chartHeight,
			width: this.chartWidth,
			dateFormat: 'dd MMM yy',
			type: 'area',
		} as LineChartOptions;

		this.tableOptionsSignal = toSignal(this.currencyTableOptions$, { initialValue: {} as ICurrencyTableOptions });
	}
	public ngAfterViewInit(): void {
		this.InitializeChart();
	}

	public ngOnInit(): void {
		this.store.dispatch(new FetchAllCurrencyRates());
	}

	private InitializeChart(): void {
		this.currencyRatesGroupByCurrencyId$
			.pipe(
				takeUntilDestroyed(this.destroyRef),
				map(ratesGroupByCurrencyId =>
					ratesGroupByCurrencyId(this.tableOptionsSignal().selectedItem.currencyId)
				),
				filter(ratesGroup => !_.isEmpty(ratesGroup?.rateValues)),
				map(ratesGroup => ratesGroup.rateValues ?? [])
			)
			.subscribe(rateValues => {
				const chartOptions = this.lineChartService.getChartOptions(
					rateValues,
					this.lineChartOptions,
					chartTitle => {
						this.chart.updateOptions({
							title: {
								text: chartTitle.text,
								style: chartTitle.style,
							},
						});
					}
				);

				chartOptions.title = LineChartTitleService.calculateTitle(
					this.tableOptionsSignal().selectedItem.abbreviation,
					chartOptions.series[0].data as number[]
				);

				if (_.isNil(this.chartOptions.chart)) {
					this.chartOptions = chartOptions;
				}

				this.chart?.updateOptions(chartOptions);

				this.isChartInitialized$.next(true);
			});
	}
}
