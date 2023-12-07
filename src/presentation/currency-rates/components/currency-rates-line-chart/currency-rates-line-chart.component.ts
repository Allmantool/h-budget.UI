import {
	AfterViewInit,
	ChangeDetectionStrategy,
	Component,
	DestroyRef,
	inject,
	Input,
	OnInit,
	ViewChild,
} from '@angular/core';
import { Signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';

import * as _ from 'lodash';

import { Select, Store } from '@ngxs/store';
import { ChartComponent } from 'ng-apexcharts';
import { BehaviorSubject, combineLatest, Observable, Subject } from 'rxjs';
import { filter, map } from 'rxjs/operators';

import { CurrencyChartOptions } from '../../../../app/modules/shared/store/models/currency-rates/currency-chart-option.';
import { CurrencyTableOptions } from '../../../../app/modules/shared/store/models/currency-rates/currency-table-options';
import { FetchAllCurrencyRates } from '../../../../app/modules/shared/store/states/rates/actions/currency.actions';
import { getCurrencyChartOptions } from '../../../../app/modules/shared/store/states/rates/selectors/currency-chart-options.selectors';
import { getCurrencyTableOptions } from '../../../../app/modules/shared/store/states/rates/selectors/currency-table-options.selectors';
import { getCurrencyRatesGroupByCurrencyId } from '../../../../app/modules/shared/store/states/rates/selectors/currency.selectors';
import { CurrencyRateGroupModel } from '../../../../domain/models/rates/currency-rates-group.model';
import { ChartOptions } from '../../models/chart-options';
import { CurrencyGridRateModel } from '../../models/currency-grid-rate.model';
import { LineChartOptions } from '../../models/line-chart-options';
import { LineChartService } from '../../services/line-chart.service';

@Component({
	selector: 'currency-rates-line-chart',
	templateUrl: './currency-rates-line-chart.component.html',
	styleUrls: ['./currency-rates-line-chart.component.css'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CurrencyRatesLineChartComponent implements AfterViewInit, OnInit {
	private readonly destroyRef = inject(DestroyRef);

	public tableOptionsSignal: Signal<CurrencyTableOptions>;

	@Select(getCurrencyRatesGroupByCurrencyId)
	public currencyRatesGroupByCurrencyId$!: Observable<(id: number) => CurrencyRateGroupModel>;

	@Select(getCurrencyTableOptions)
	public currencyTableOptions$!: Observable<CurrencyTableOptions>;

	@Select(getCurrencyChartOptions)
	public currencyChartOptions$!: Observable<CurrencyChartOptions>;

	@ViewChild(ChartComponent, { static: false }) chart!: ChartComponent;
	public chartOptions: Partial<ChartOptions> = {};

	@Input() public chartWidth = '500%';
	@Input() public chartHeight = '360';

	public isChartInitialized$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
	public currencyRates$: Subject<CurrencyGridRateModel[]> = new Subject<CurrencyGridRateModel[]>();

	private lineChartOptions: LineChartOptions;

	constructor(
		private store: Store,
		private linechartService: LineChartService
	) {
		this.lineChartOptions = {
			height: this.chartHeight,
			width: this.chartWidth,
			dateFormat: 'dd MMM yy',
			type: 'area',
		} as LineChartOptions;

		this.tableOptionsSignal = toSignal(this.currencyTableOptions$, { initialValue: {} as CurrencyTableOptions });
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
				const chartOptions = this.linechartService.getChartOptions(
					rateValues,
					this.chart,
					this.lineChartOptions
				);

				if (_.isNil(this.chartOptions.chart)) {
					this.chartOptions = chartOptions;
				}

				this.chart?.updateOptions(chartOptions);

				this.isChartInitialized$.next(true);
			});
	}
}
