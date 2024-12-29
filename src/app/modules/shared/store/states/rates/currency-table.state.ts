import { Injectable } from '@angular/core';

import { Action, State, StateContext } from '@ngxs/store';
import { addMonths } from 'date-fns';

import { SetActiveCurrency, SetCurrencyDateRange } from './actions/currency-table-options.actions';
import { ICurrencyTableStateModel } from './models/currency-table-state.model';
import { RatesGridDefaultOptions } from '../../../constants/rates-grid-default-options';
import { ICurrencyDateRange } from '../../models/currency-rates/currency-date-range';
import { ICurrencyTableItem } from '../../models/currency-rates/currency-table-item';
import { ICurrencyTableOptions } from '../../models/currency-rates/currency-table-options';

@State<ICurrencyTableStateModel>({
	name: 'currencyTableState',
	defaults: {
		tableOptions: {
			selectedItem: {
				currencyId: RatesGridDefaultOptions.CURRENCY_ID,
				abbreviation: RatesGridDefaultOptions.CURRENCY_ABBREVIATION,
			} as ICurrencyTableItem,
			selectedDateRange: {
				start: addMonths(new Date(), -RatesGridDefaultOptions.PERIOD_IN_MONTHS_AMOUNT),
				end: new Date(),
				diffInMonths: RatesGridDefaultOptions.PERIOD_IN_MONTHS_AMOUNT,
			} as ICurrencyDateRange,
		} as ICurrencyTableOptions,
	},
	children: [],
})
@Injectable()
export class CurrencyTableState {
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
				} as ICurrencyTableItem,
				selectedDateRange: getState().tableOptions.selectedDateRange,
			} as ICurrencyTableOptions,
		});
	}

	@Action(SetCurrencyDateRange)
	setCurrencyDateRange(
		{ getState, patchState }: StateContext<ICurrencyTableStateModel>,
		{ amountOfMonths, endDate }: SetCurrencyDateRange
	): void {
		const currentDate = endDate ?? new Date();

		patchState({
			tableOptions: {
				selectedItem: getState().tableOptions.selectedItem,
				selectedDateRange: {
					start: addMonths(currentDate, -amountOfMonths),
					end: currentDate,
					diffInMonths: amountOfMonths,
				} as ICurrencyDateRange,
			} as ICurrencyTableOptions,
		});
	}
}
