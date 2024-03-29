import { Injectable } from '@angular/core';

import { Action, State, StateContext } from '@ngxs/store';

import { SetActiveCurrencyTrendTitle } from './actions/currency-chart-options.actions';
import { ICurrencyChartStateModel } from './models/currency-chart-state.model';
import { ICurrencyChartOptions } from '../../models/currency-rates/currency-chart-option.';

@State<ICurrencyChartStateModel>({
	name: 'currencyChartState',
	defaults: {
		chartOptions: {
			activeCurrencyTrendTitle: '',
		} as ICurrencyChartOptions,
	},
	children: [],
})
@Injectable()
export class CurrencyChartState {
	@Action(SetActiveCurrencyTrendTitle)
	SetActiveCurrencyTrendTitle(
		{ patchState }: StateContext<ICurrencyChartStateModel>,
		{ activeCurrencyTitle }: SetActiveCurrencyTrendTitle
	): void {
		patchState({
			chartOptions: {
				activeCurrencyTrendTitle: activeCurrencyTitle,
			} as ICurrencyChartOptions,
		});
	}
}
