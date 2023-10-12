import { createSelector } from '@ngxs/store';

import { ICounterpartiesStateModel } from '../models/ICounterpartiesStateModel';
import { CounterpartiesState } from '../counterparties.state';

export const getContractors = createSelector(
	[CounterpartiesState],
	(state: ICounterpartiesStateModel) => state?.counterparties
);
