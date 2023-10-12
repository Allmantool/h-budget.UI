import { Injectable } from '@angular/core';

import { State, Action, StateContext } from '@ngxs/store';
import { addMonths } from 'date-fns';

import { ICurrencyTableStateModel } from './models/currency-table-state.model';
import { CurrencyTableOptions } from '../../models/currency-rates/currency-table-options';
import { RatesGridDefaultOptions } from '../../../constants/rates-grid-default-options';
import { CurrencyDateRange } from '../../models/currency-rates/currency-date-range';
import { CurrencyTableItem } from '../../models/currency-rates/currency-table-item';
import { SetActiveCurrency, SetCurrencyDateRange } from './actions/currency-table-options.actions';

@State<ICurrencyTableStateModel>({
	name: 'currencyTableState',
	defaults: {
		tableOptions: {
			selectedItem: {
				currencyId: RatesGridDefaultOptions.CURRENCY_ID,
				abbreviation: RatesGridDefaultOptions.CURRENCY_ABBREVIATION,
			} as CurrencyTableItem,
			selectedDateRange: {
				start: addMonths(new Date(), -RatesGridDefaultOptions.PERIOD_IN_MONTHS_AMMOUNT),
				end: new Date(),
				diffInMonths: RatesGridDefaultOptions.PERIOD_IN_MONTHS_AMMOUNT,
			} as CurrencyDateRange,
		} as CurrencyTableOptions,
	},
	children: [],
})
@Injectable()
export class CurrencyTableState {
	constructor() {}

	@Action(SetActiveCurrency)
	setActiveCurrency(
		{ getState, patchState }: StateContext<ICurrencyTableStateModel>,
		{ id, label }: SetActiveCurrency
	): void {
		patchState({
			tableOptions: {
				selectedItem: {
					currencyId: id,
					abbreviation: label,
				} as CurrencyTableItem,
				selectedDateRange: getState().tableOptions.selectedDateRange,
			} as CurrencyTableOptions,
		});
	}

	@Action(SetCurrencyDateRange)
	setCurrencyDateRange(
		{ getState, patchState }: StateContext<ICurrencyTableStateModel>,
		{ amountOfMonths }: SetCurrencyDateRange
	): void {
		const currentDate = new Date();

		patchState({
			tableOptions: {
				selectedItem: getState().tableOptions.selectedItem,
				selectedDateRange: {
					start: addMonths(currentDate, -amountOfMonths),
					end: currentDate,
					diffInMonths: amountOfMonths,
				} as CurrencyDateRange,
			} as CurrencyTableOptions,
		});
	}
}
