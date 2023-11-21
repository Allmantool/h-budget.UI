import { SelectionModel } from '@angular/cdk/collections';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatTableDataSource } from '@angular/material/table';

import * as _ from 'lodash';

import { Select, Store } from '@ngxs/store';
import { combineLatest, Observable, Subject } from 'rxjs';
import { take } from 'rxjs/operators';

import { NationalBankCurrencyProvider } from 'data/providers/rates/national-bank-currency.provider';
import { RatesGridColumnOptions } from 'presentation/currency-rates/constants/rates-grid-options';

import { RatesDialogService } from './../../services/rates-dialog.service';
import { RatesGridDefaultOptions } from '../../../../app/modules/shared/constants/rates-grid-default-options';
import { CurrencyTableOptions } from '../../../../app/modules/shared/store/models/currency-rates/currency-table-options';
import { PreviousDayCurrencyRate } from '../../../../app/modules/shared/store/models/currency-rates/previous-day-currency-rate';
import { SetCurrencyDateRange } from '../../../../app/modules/shared/store/states/rates/actions/currency-table-options.actions';
import { getCurrencyTableOptions } from '../../../../app/modules/shared/store/states/rates/selectors/currency-table-options.selectors';
import {
	getCurrencyRatesFromPreviousDay,
	getRates,
} from '../../../../app/modules/shared/store/states/rates/selectors/currency.selectors';
import { CurrencyGridRateModel } from '../../models/currency-grid-rate.model';
import { CurrencyRatesGridService } from '../../services/currency-rates-grid.service';
import { CurrencyRateValueModel } from 'domain/models/rates/currency-rate-value.model';
import { CurrencyRateGroupModel } from 'domain/models/rates/currency-rates-group.model';

@Component({
	selector: 'app-currency-rates-grid',
	templateUrl: './currency-rates-grid.component.html',
	styleUrls: ['./currency-rates-grid.component.css'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CurrencyRatesGridComponent implements OnInit {
	private readonly destroyRef = inject(DestroyRef);
	@Select(getRates) rates$!: Observable<CurrencyRateValueModel[]>;

	@Select(getCurrencyTableOptions)
	currencyTableOptions$!: Observable<CurrencyTableOptions>;

	@Select(getCurrencyRatesFromPreviousDay)
	previousDayRates$!: Observable<PreviousDayCurrencyRate[]>;

	public selectedCurrencyPertionOption: number = RatesGridDefaultOptions.PERIOD_IN_MONTHS_AMMOUNT;

	public todayCurrencyRateGroups$: Subject<CurrencyRateGroupModel[]> = new Subject<CurrencyRateGroupModel[]>();

	public todayRatesTableDataSource = new MatTableDataSource<CurrencyGridRateModel>([]);
	public todayRatesTableSelection = new SelectionModel<CurrencyGridRateModel>(false, []);

	public ratesGridColumnOptions: typeof RatesGridColumnOptions = RatesGridColumnOptions;

	constructor(
		private readonly currencyRateProvider: NationalBankCurrencyProvider,
		private readonly store: Store,
		private readonly ratesDialogService: RatesDialogService,
		private readonly currencyRatesGridService: CurrencyRatesGridService
	) {}

	ngOnInit(): void {
		this.todayCurrencyRateGroups$
			.pipe(take(1), takeUntilDestroyed(this.destroyRef))
			.subscribe(
				(todayRateGroups: CurrencyRateGroupModel[]) =>
					(this.todayRatesTableDataSource = this.currencyRatesGridService.GetDataSource(todayRateGroups))
			);

		combineLatest([this.currencyTableOptions$, this.todayCurrencyRateGroups$])
			.pipe(take(1), takeUntilDestroyed(this.destroyRef))
			.subscribe(([tableOptions, rateGroups]) => {
				this.todayRatesTableSelection = this.currencyRatesGridService.GetTableSelection(
					rateGroups,
					tableOptions.selectedItem.currencyId
				);

				this.selectedCurrencyPertionOption = tableOptions.selectedDateRange.diffInMonths;
			});

		this.getTodayCurrencyRates();
	}

	public isAllSelected(): boolean {
		return this.currencyRatesGridService.isAllCheckboxesSelected(
			this.todayRatesTableSelection.selected,
			this.todayRatesTableDataSource.data.length
		);
	}

	public masterToggle(selectedCurrencyId: number): void {
		const isAllSelected: boolean = this.isAllSelected();

		if (isAllSelected && this.todayRatesTableSelection.selected.length === 1) {
			return;
		}

		const currencyRatesForselectByDefault: CurrencyGridRateModel = this.todayRatesTableDataSource.data[0];

		if (isAllSelected) {
			this.todayRatesTableSelection.clear();
			this.todayRatesTableSelection.select(currencyRatesForselectByDefault);
		} else {
			this.todayRatesTableSelection.select(
				...this.todayRatesTableDataSource.data.filter(i => (i?.currencyId as number) === selectedCurrencyId)
			);
		}
	}

	public getTodayCurrencyRates(): void {
		this.currencyRateProvider
			.getTodayCurrencies()
			.pipe(take(1))
			.subscribe(todayRatesGroups => {
				this.currencyRatesGridService.syncWithRatesStore(todayRatesGroups);

				this.todayCurrencyRateGroups$.next(todayRatesGroups);
			});

		combineLatest([this.previousDayRates$, this.todayCurrencyRateGroups$, this.currencyTableOptions$])
			.pipe(take(1))
			.subscribe(([previousDayRates, todayRateGroups, tableOptions]) => {
				const dataSource = this.currencyRatesGridService.enrichWithTrend(previousDayRates, todayRateGroups);
				this.todayRatesTableDataSource = dataSource;

				this.masterToggle(tableOptions.selectedItem.currencyId);
			});
	}

	public openGetCurrencyRatesDialog(): void {
		this.ratesDialogService.openLoadRatesForPeriod();
	}

	public setDateRange(monthsAmount: number): void {
		this.store.dispatch(new SetCurrencyDateRange(monthsAmount));
	}
}
