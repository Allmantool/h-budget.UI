import { Injectable } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { SelectionModel } from '@angular/cdk/collections';

import { Mapper } from '@dynamic-mapper/angular';
import { Store } from '@ngxs/store';
import * as _ from 'lodash';

import { CurrencyGridRateModel } from '../models/currency-grid-rate.model';
import { CurrencyRateGroupModel } from 'domain/models/rates/currency-rates-group.model';
import { PreviousDayCurrencyRate } from 'app/modules/shared/store/models/currency-rates/previous-day-currency-rate';
import { RatesGridDefaultOptions } from 'app/modules/shared/constants/rates-grid-default-options';
import { CurrencyTrend } from 'app/modules/shared/store/models/currency-rates/currency-trend';
import { PresentationRatesMappingProfile } from '../mappers/presentation-rates-mapping.profiler';
import { AddCurrencyGroups } from '../../../app/modules/shared/store/states/rates/actions/currency.actions';
import { SetActiveCurrency } from '../../../app/modules/shared/store/states/rates/actions/currency-table-options.actions';

@Injectable()
export class CurrencyRatesGridService {
	constructor(
		private readonly mapper: Mapper,
		private readonly store: Store
	) {}

	public GetDataSource(
		rateGroups: CurrencyRateGroupModel[]
	): MatTableDataSource<CurrencyGridRateModel> {
		const source = this.mapper.map(
			PresentationRatesMappingProfile.CurrencyRateGroupModelToGridRates,
			rateGroups
		);

		return new MatTableDataSource<CurrencyGridRateModel>(source);
	}

	public GetTableSelection(
		rateGroups: CurrencyRateGroupModel[],
		currencyId: number
	): SelectionModel<CurrencyGridRateModel> {
		const selectedGroups = _.filter(
			rateGroups,
			(rg: CurrencyRateGroupModel) => rg.currencyId === currencyId
		);

		const source = this.mapper.map(
			PresentationRatesMappingProfile.CurrencyRateGroupModelToGridRates,
			selectedGroups
		);

		return new SelectionModel<CurrencyGridRateModel>(false, source);
	}

	public syncWithRatesStore(
		todayRatesGroups: CurrencyRateGroupModel[]
	): void {
		this.store.dispatch(new AddCurrencyGroups(todayRatesGroups));
	}

	public isAllCheckboxesSelected(
		selectedItems: CurrencyGridRateModel[],
		supportedCurrenciesAmount: number
	): boolean {
		const selectedTableItem = selectedItems;
		const selectedRate = _.first(selectedTableItem);

		if (_.isNil(selectedRate) || _.isNil(selectedRate?.currencyId)) {
			return false;
		}

		console.log('Current currencyId: ' + selectedRate?.currencyId);

		if (
			!_.isNil(selectedRate.currencyId) &&
			!_.isNil(selectedRate.abbreviation)
		) {
			this.store.dispatch(
				new SetActiveCurrency(
					selectedRate.currencyId,
					selectedRate.abbreviation
				)
			);
		}

		return selectedTableItem.length === supportedCurrenciesAmount;
	}

	public enrichWithTrend(
		previousDayRates: PreviousDayCurrencyRate[],
		todayRateGroups: CurrencyRateGroupModel[]
	): MatTableDataSource<CurrencyGridRateModel> {
		const gridRates: CurrencyGridRateModel[] = this.mapper.map(
			PresentationRatesMappingProfile.CurrencyRateGroupModelToGridRates,
			todayRateGroups
		);

		gridRates.forEach((gridRateREcord) => {
			const previousDayRate = _.find(
				previousDayRates,
				(r) => r.currencyId === gridRateREcord.currencyId
			);
			const previousDayRatePerUnit = previousDayRate?.ratePerUnit;

			gridRateREcord.currencyTrend = this.getTrend(
				gridRateREcord.ratePerUnit,
				previousDayRatePerUnit
			);
			gridRateREcord.rateDiff = this.getRateDiff(
				previousDayRatePerUnit as number,
				gridRateREcord.ratePerUnit ?? 0
			);
		});

		return new MatTableDataSource<CurrencyGridRateModel>(gridRates);
	}

	private getRateDiff(previousDayRate: number, todayRate: number): string {
		if (_.isNil(previousDayRate)) {
			return 'N/A';
		}

		const diffAsPercentage =
			_.divide(_.subtract(todayRate, previousDayRate), previousDayRate) *
			100;

		return _.round(
			diffAsPercentage,
			RatesGridDefaultOptions.RATE_DIFF_PRECISION
		).toString();
	}

	private getTrend(todayDayRate?: number, previousDayRate?: number): string {
		if (_.isNil(todayDayRate) || _.isNil(previousDayRate)) {
			return CurrencyTrend.notChanged;
		}

		if (todayDayRate === previousDayRate) {
			return CurrencyTrend.notChanged;
		}

		if (todayDayRate > previousDayRate) {
			return CurrencyTrend.up;
		}

		return CurrencyTrend.down;
	}
}
