import { createSelector } from '@ngxs/store';

import { CurrencyTableState } from '../currency-table.state';
import { ICurrencyTableStateModel } from '../models/currency-table-state.model';

export const getCurrencyTableOptions = createSelector(
	[CurrencyTableState],
	(state: ICurrencyTableStateModel) => state?.tableOptions
);
