import { createSelector } from '@ngxs/store';

import { AccountingOperationsTableState } from '../accounting-operations-table.state';
import { IAccountingTableStateModel } from '../models/accounting-table-state.model';

export const getAccountingTableOptions = createSelector(
	[AccountingOperationsTableState],
	(state: IAccountingTableStateModel) => state?.tableOptions
);

export const getSelectedRecordGuid = createSelector(
	[AccountingOperationsTableState],
	(state: IAccountingTableStateModel) => state?.tableOptions?.selectedRecordGuid
);
