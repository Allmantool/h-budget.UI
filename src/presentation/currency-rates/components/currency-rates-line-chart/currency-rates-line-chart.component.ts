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
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import * as _ from 'lodash';

import { Select, Store } from '@ngxs/store';
import { ChartComponent } from 'ng-apexcharts';
import { BehaviorSubject, combineLatest, from, Observable, Subject } from 'rxjs';
import { filter, map, take } from 'rxjs/operators';

import { getCurrencyRatesGroupByCurrencyId } from 'app/modules/shared/store/states/rates/selectors/currency.selectors';

import { CurrencyChartOptions } from '../../../../app/modules/shared/store/models/currency-rates/currency-chart-option.';
import { CurrencyTableOptions } from '../../../../app/modules/shared/store/models/currency-rates/currency-table-options';
import { FetchAllCurrencyRates } from '../../../../app/modules/shared/store/states/rates/actions/currency.actions';
import { getCurrencyChartOptions } from '../../../../app/modules/shared/store/states/rates/selectors/currency-chart-options.selectors';
import { getCurrencyTableOptions } from '../../../../app/modules/shared/store/states/rates/selectors/currency-table-options.selectors';
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

	@Select(getCurrencyRatesGroupByCurrencyId)
	currencyRatesGroupByCurrencyId$!: Observable<(id: number) => CurrencyRateGroupModel>;

	@Select(getCurrencyTableOptions)
	currencyTableOptions$!: Observable<CurrencyTableOptions>;

	@Select(getCurrencyChartOptions)
	currencyChartOptions$!: Observable<CurrencyChartOptions>;

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
	}
	public ngAfterViewInit(): void {
		this.populateChartOptions();
	}

	public ngOnInit(): void {
		this.store.dispatch(new FetchAllCurrencyRates());
	}

	private populateChartOptions(): void {
		combineLatest([this.currencyRatesGroupByCurrencyId$, this.currencyTableOptions$])
			.pipe(
				takeUntilDestroyed(this.destroyRef),
				map(([ratesGroupByCurrencyId, tableOptions]) => {
					const ratesGroup = ratesGroupByCurrencyId(tableOptions.selectedItem.currencyId);

					return {
						ratesGroup: ratesGroup,
						tableOptions: tableOptions,
					};
				}),
				filter(payload => !_.isEmpty(payload.ratesGroup?.rateValues))
			)
			.subscribe(payload => {
				this.chartOptions = this.linechartService.getChartOptions(
					payload.ratesGroup?.rateValues ?? [],
					payload.tableOptions,
					this.lineChartOptions
				);

				this.isChartInitialized$.next(true);
			});

		this.currencyChartOptions$
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe(chartOptions =>
				from(this.updateTitle(chartOptions.activeCurrencyTrendTitle)).pipe(take(1)).subscribe()
			);
	}

	private async updateTitle(titleText: string): Promise<void> {
		return await this.chart?.updateOptions({
			title: {
				text: titleText,
			},
		});
	}
}
