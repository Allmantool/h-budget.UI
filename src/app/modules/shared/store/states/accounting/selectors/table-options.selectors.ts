import { createSelector } from '@ngxs/store';

import { IAccountingTableStateModel } from '../models/accounting-table-state.model';
import { AccountingOperationsTableState } from '../accounting-operations-table.state';

export const getAccountingTableOptions = createSelector(
	[AccountingOperationsTableState],
	(state: IAccountingTableStateModel) => state?.tableOptions
);
