import { createSelector } from '@ngxs/store';

import { IAccountingOperationsStateModel } from '../models/accounting-state.model';
import { AccountingOperationsState } from '../payment-operations.state';

export const getAccountingRecords = createSelector(
	[AccountingOperationsState],
	(state: IAccountingOperationsStateModel) => state?.operationRecords
);
