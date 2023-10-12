import { Injectable } from '@angular/core';

import { State, Action, StateContext } from '@ngxs/store';

import { ICurrencyChartStateModel } from './models/currency-chart-state.model';
import { CurrencyChartOptions } from '../../models/currency-rates/currency-chart-option.';
import { SetActiveCurrencyTrendTitle } from './actions/currency-chart-options.actions';

@State<ICurrencyChartStateModel>({
	name: 'currencyChartState',
	defaults: {
		chartOptions: {
			activeCurrencyTrendTitle: '',
		} as CurrencyChartOptions,
	},
	children: [],
})
@Injectable()
export class CurrencyChartState {
	constructor() {}

	@Action(SetActiveCurrencyTrendTitle)
	SetActiveCurrencyTrendTitle(
		{ patchState }: StateContext<ICurrencyChartStateModel>,
		{ activeCurrencyTitle }: SetActiveCurrencyTrendTitle
	): void {
		patchState({
			chartOptions: {
				activeCurrencyTrendTitle: activeCurrencyTitle,
			} as CurrencyChartOptions,
		});
	}
}
