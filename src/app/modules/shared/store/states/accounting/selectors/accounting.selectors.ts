import { createSelector } from '@ngxs/store';

import { AccountingOperationsState } from '../accounting-operations.state';
import { IAccountingOperationsStateModel } from '../models/accounting-state.model';

export const getAccountingRecords = createSelector(
	[AccountingOperationsState],
	(state: IAccountingOperationsStateModel) => state?.operationRecords
);
