import * as _ from 'lodash';

import { createSelector } from '@ngxs/store';

import { CounterpartiesState } from '../counterparties.state';
import { ICounterpartiesStateModel } from '../models/ICounterpartiesStateModel';

export const getContractors = createSelector(
	[CounterpartiesState],
	(state: ICounterpartiesStateModel) => state?.counterparties
);

export const getContractorNodes = createSelector([CounterpartiesState], (state: ICounterpartiesStateModel) =>
	_.map(state?.counterparties, i => i.nameNodes?.parseToTreeAsString())
);

export const getContractorAsNodesMap = createSelector(
	[CounterpartiesState],
	(state: ICounterpartiesStateModel) =>
		new Map(state?.counterparties.map(c => [c.nameNodes?.parseToTreeAsString(), c]))
);
