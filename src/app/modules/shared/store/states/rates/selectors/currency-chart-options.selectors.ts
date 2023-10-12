import { createSelector } from '@ngxs/store';

import { CurrencyChartState } from '../currency-chart.state';
import { ICurrencyChartStateModel } from '../models/currency-chart-state.model';

export const getCurrencyChartOptions = createSelector(
	[CurrencyChartState],
	(state: ICurrencyChartStateModel) => state?.chartOptions
);
