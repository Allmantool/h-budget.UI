import { Injectable } from '@angular/core';

import * as _ from 'lodash';

import { Action, State, StateContext } from '@ngxs/store';
import { take, tap } from 'rxjs';

import { AddCurrencyGroups, FetchAllCurrencyRates } from './actions/currency.actions';
import { CurrencyChartState } from './currency-chart.state';
import { CurrencyTableState } from './currency-table.state';
import { ICurrencyRatesStateModel } from './models/currency-rates-state.model';
import { NationalBankCurrenciesProvider } from '../../../../../../data/providers/rates/national-bank-currencies.provider';
import { CurrencyRateValueModel } from '../../../../../../domain/models/rates/currency-rate-value.model';
import { CurrencyRateGroupModel } from '../../../../../../domain/models/rates/currency-rates-group.model';

@State<ICurrencyRatesStateModel>({
	name: 'currencyState',
	defaults: {
		rateGroups: [],
	},
	children: [CurrencyTableState, CurrencyChartState],
})
@Injectable()
export class CurrencyRatesState {
	constructor(private readonly currencyRateProvider: NationalBankCurrenciesProvider) {}

	@Action(AddCurrencyGroups)
	addCurrencyGroups(
		{ getState, patchState }: StateContext<ICurrencyRatesStateModel>,
		{ addedRateGroups }: AddCurrencyGroups
	): void {
		const ratesFromTheState = getState().rateGroups;

		const upToDateCurrencyGroups = ratesFromTheState.map(cg => {
			const ratesToAdd: CurrencyRateValueModel[] = addedRateGroups.find(i => i.currencyId == cg.currencyId)?.rateValues ?? [];

			const ratesForUpdate = _.differenceWith(ratesToAdd, cg.rateValues!, _.isEqual.bind(this));

			if (_.isNil(ratesForUpdate) || _.isEmpty(ratesForUpdate)) {
				return cg;
			}

			const existingUnchangedRates = _.filter(
				cg.rateValues,
				cgRate => !_.some(ratesToAdd, addRate => addRate.updateDate === cgRate.updateDate)
			);

			const updatedCurrencyGroup = _.cloneDeep(cg);

			const mergedRateGroups = _.concat(existingUnchangedRates, ratesForUpdate);

			updatedCurrencyGroup.rateValues = _.orderBy(mergedRateGroups, r => r.updateDate);

			return updatedCurrencyGroup;
		});

		patchState({
			rateGroups: upToDateCurrencyGroups.length ? upToDateCurrencyGroups : addedRateGroups,
		});
	}

	@Action(FetchAllCurrencyRates)
	fetchAllCurrencyRates(ctx: StateContext<ICurrencyRatesStateModel>) {
		return this.currencyRateProvider.getCurrencies().pipe(
			take(1),
			tap(currencyRateGroups =>
				ctx.patchState({
					rateGroups: _.map(
						currencyRateGroups,
						rg =>
							({
								currencyId: rg.currencyId,
								name: rg.name,
								abbreviation: rg.abbreviation,
								scale: rg.scale,
								rateValues: _.orderBy(rg.rateValues, i => i.updateDate),
							}) as CurrencyRateGroupModel
					),
				})
			)
		);
	}
}
