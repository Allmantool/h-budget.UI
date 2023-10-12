import { createSelector } from '@ngxs/store';

import * as _ from 'lodash';

import { CurrencyRatesState } from '../currency-rates.state';
import { CurrencyRateGroupModel } from 'domain/models/rates/currency-rates-group.model';
import { PreviousDayCurrencyRate } from '../../../models/currency-rates/previous-day-currency-rate';
import { CurrencyRateValueModel } from 'domain/models/rates/currency-rate-value.model';
import { ICurrencyRatesStateModel } from '../models/currency-rates-state.model';

export const getRates = createSelector(
	[CurrencyRatesState],
	(state: ICurrencyRatesStateModel) => state.rateGroups
);

export const getCurrencyRatesGroupByCurrencyId = createSelector(
	[CurrencyRatesState],
	(state: ICurrencyRatesStateModel) => {
		return (id: number) =>
			_.find(
				state.rateGroups,
				(rg: CurrencyRateGroupModel) => rg.currencyId === id
			) as CurrencyRateGroupModel;
	}
);

export const getCurrencyRatesFromPreviousDay = createSelector(
	[getRates],
	(rateGroups: CurrencyRateGroupModel[]) => {
		const previousDayRates = _.chain(rateGroups)
			.map((rg: CurrencyRateGroupModel) => {
				const orderedRates = _.orderBy(
					rg.rateValues,
					(rv: CurrencyRateValueModel) => rv.updateDate,
					['desc']
				);

				const previousDayRates = orderedRates[1] ?? orderedRates[0];

				return <PreviousDayCurrencyRate>{
					currencyId: rg.currencyId,
					ratePerUnit: previousDayRates?.ratePerUnit,
					updateDate: previousDayRates?.updateDate,
				};
			})
			.value();

		return previousDayRates;
	}
);
