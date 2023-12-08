import { SelectionModel } from '@angular/cdk/collections';
import { Injectable } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';

import * as _ from 'lodash';

import { Mapper } from '@dynamic-mapper/angular';
import { Store } from '@ngxs/store';
import { firstValueFrom } from 'rxjs';

import { RatesGridDefaultOptions } from '../../../app/modules/shared/constants/rates-grid-default-options';
import { CurrencyTrend } from '../../../app/modules/shared/store/models/currency-rates/currency-trend';
import { IPreviousDayCurrencyRate } from '../../../app/modules/shared/store/models/currency-rates/previous-day-currency-rate';
import { AddCurrencyGroups } from '../../../app/modules/shared/store/states/rates/actions/currency.actions';
import { NationalBankCurrenciesProvider } from '../../../data/providers/rates/national-bank-currencies.provider';
import { CurrencyRateGroupModel } from '../../../domain/models/rates/currency-rates-group.model';
import { PresentationRatesMappingProfile } from '../mappers/presentation-rates-mapping.profiler';
import { CurrencyGridRateModel } from '../models/currency-grid-rate.model';

@Injectable()
export class CurrencyRatesGridService {
	constructor(
		private readonly mapper: Mapper,
		private readonly store: Store,
		private readonly currencyRatesProvider: NationalBankCurrenciesProvider
	) {}

	public GetDataSource(rateGroups: CurrencyRateGroupModel[]): MatTableDataSource<CurrencyGridRateModel> {
		const source = this.mapper.map(PresentationRatesMappingProfile.CurrencyRateGroupModelToGridRates, rateGroups);

		return new MatTableDataSource<CurrencyGridRateModel>(source);
	}

	public GetTableSelection(
		rateGroups: CurrencyRateGroupModel[],
		currencyId: number
	): SelectionModel<CurrencyGridRateModel> {
		const selectedGroups = _.filter(rateGroups, (rg: CurrencyRateGroupModel) => rg.currencyId === currencyId);

		const source = this.mapper.map(
			PresentationRatesMappingProfile.CurrencyRateGroupModelToGridRates,
			selectedGroups
		);

		return new SelectionModel<CurrencyGridRateModel>(false, source);
	}

	public async getTodayCurrenciesAsync(): Promise<CurrencyRateGroupModel[]> {
		const todayRatesGroups = await firstValueFrom(this.currencyRatesProvider.getTodayCurrencies());

		this.store.dispatch(new AddCurrencyGroups(todayRatesGroups));

		return todayRatesGroups;
	}

	public enrichWithTrend(
		previousDayRates: IPreviousDayCurrencyRate[],
		todayRateGroups: CurrencyRateGroupModel[]
	): MatTableDataSource<CurrencyGridRateModel> {
		const gridRates: CurrencyGridRateModel[] = this.mapper.map(
			PresentationRatesMappingProfile.CurrencyRateGroupModelToGridRates,
			todayRateGroups
		);

		const previousDayRatesMap = new Map(previousDayRates.map(r => [r.currencyId, r.ratePerUnit]));

		gridRates.forEach(gridRecord => {
			const previousDayRatePerUnit = previousDayRatesMap.get(gridRecord.currencyId!);

			gridRecord.currencyTrend = this.getTrend(gridRecord.ratePerUnit, previousDayRatePerUnit);
			gridRecord.rateDiff = this.getRateDiff(previousDayRatePerUnit!, gridRecord.ratePerUnit ?? 0);
		});

		return new MatTableDataSource<CurrencyGridRateModel>(gridRates);
	}

	private getRateDiff(previousDayRate: number, todayRate: number): string {
		if (_.isNil(previousDayRate)) {
			return 'N/A';
		}

		const diffAsPercentage = _.divide(_.subtract(todayRate, previousDayRate), previousDayRate) * 100;

		return _.round(diffAsPercentage, RatesGridDefaultOptions.RATE_DIFF_PRECISION).toString();
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
