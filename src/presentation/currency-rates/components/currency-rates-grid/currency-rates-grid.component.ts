import { SelectionModel } from '@angular/cdk/collections';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, Signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { MatTableDataSource } from '@angular/material/table';

import { Select, Store } from '@ngxs/store';
import { combineLatest, Observable, Subject } from 'rxjs';

import { RatesDialogService } from './../../services/rates-dialog.service';
import { ICurrencyTableOptions } from '../../../../app/modules/shared/store/models/currency-rates/currency-table-options';
import { IPreviousDayCurrencyRate } from '../../../../app/modules/shared/store/models/currency-rates/previous-day-currency-rate';
import {
	SetActiveCurrency,
	SetCurrencyDateRange,
} from '../../../../app/modules/shared/store/states/rates/actions/currency-table-options.actions';
import { getCurrencyTableOptions } from '../../../../app/modules/shared/store/states/rates/selectors/currency-table-options.selectors';
import {
	getCurrencyRatesFromPreviousDay,
	getRates,
} from '../../../../app/modules/shared/store/states/rates/selectors/currency.selectors';
import { CurrencyRateValueModel } from '../../../../domain/models/rates/currency-rate-value.model';
import { CurrencyRateGroupModel } from '../../../../domain/models/rates/currency-rates-group.model';
import { RatesGridColumnOptions } from '../../constants/rates-grid-options';
import { CurrencyGridRateModel } from '../../models/currency-grid-rate.model';
import { CurrencyRatesGridService } from '../../services/currency-rates-grid.service';
import { LoaderService } from '../../../../app/modules/shared/services/loader-service';

@Component({
	selector: 'app-currency-rates-grid',
	templateUrl: './currency-rates-grid.component.html',
	styleUrls: ['./currency-rates-grid.component.css'],
	changeDetection: ChangeDetectionStrategy.OnPush,
	standalone: false,
})
export class CurrencyRatesGridComponent implements OnInit {
	private readonly destroyRef = inject(DestroyRef);

	public tableOptionsSignal: Signal<ICurrencyTableOptions>;

	@Select(getRates)
	public rates$!: Observable<CurrencyRateValueModel[]>;

	@Select(getCurrencyTableOptions)
	public currencyTableOptions$!: Observable<ICurrencyTableOptions>;

	@Select(getCurrencyRatesFromPreviousDay)
	public previousDayRates$!: Observable<IPreviousDayCurrencyRate[]>;

	public todayCurrencyRateGroups$: Subject<CurrencyRateGroupModel[]> = new Subject<CurrencyRateGroupModel[]>();

	public todayRatesTableDataSource = new MatTableDataSource<CurrencyGridRateModel>([]);
	public todayRatesTableSelection = new SelectionModel<CurrencyGridRateModel>(false, []);

	public ratesGridColumnOptions: typeof RatesGridColumnOptions = RatesGridColumnOptions;

	constructor(
		private readonly store: Store,
		private readonly ratesDialogService: RatesDialogService,
		private readonly currencyRatesGridService: CurrencyRatesGridService,
		public readonly loaderService: LoaderService
	) {
		this.tableOptionsSignal = toSignal(this.currencyTableOptions$, { initialValue: {} as ICurrencyTableOptions });
	}

	async ngOnInit(): Promise<void> {
		this.todayCurrencyRateGroups$
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe((todayRateGroups: CurrencyRateGroupModel[]) => {
				this.todayRatesTableDataSource = this.currencyRatesGridService.GetDataSource(todayRateGroups);

				this.todayRatesTableSelection = this.currencyRatesGridService.GetTableSelection(
					todayRateGroups,
					this.tableOptionsSignal().selectedItem.currencyId
				);
			});

		combineLatest([this.previousDayRates$, this.todayCurrencyRateGroups$])
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe(([previousDayRates, todayRateGroups]) => {
				this.loaderService.withLoader(async () => {
					this.todayRatesTableDataSource = this.currencyRatesGridService.enrichWithTrend(
						previousDayRates,
						todayRateGroups
					);
				});
			});

		await this.getTodayCurrencyRatesAsync();
	}

	public masterToggle(currencyId: number, abbreviation: string): void {
		this.store.dispatch(new SetActiveCurrency(currencyId, abbreviation));
	}

	public async getTodayCurrencyRatesAsync(): Promise<void> {
		await this.loaderService.withLoader(async () => {
			this.todayCurrencyRateGroups$.next(await this.currencyRatesGridService.getTodayCurrenciesAsync());
		});
	}

	public openGetCurrencyRatesDialog(): void {
		this.ratesDialogService.openLoadRatesForPeriod();
	}

	public isSelectedCurrency(recordCurrencyId: number): boolean {
		return this.tableOptionsSignal().selectedItem.currencyId === recordCurrencyId;
	}

	public setDateRange(monthsAmount: number): void {
		this.store.dispatch(new SetCurrencyDateRange(monthsAmount));
	}
}
