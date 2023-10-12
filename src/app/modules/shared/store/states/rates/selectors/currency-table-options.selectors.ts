import { createSelector } from '@ngxs/store';

import { ICurrencyTableStateModel } from '../models/currency-table-state.model';
import { CurrencyTableState } from '../currency-table.state';

export const getCurrencyTableOptions = createSelector(
	[CurrencyTableState],
	(state: ICurrencyTableStateModel) => state?.tableOptions
);
