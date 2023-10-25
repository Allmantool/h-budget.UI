import { createSelector } from '@ngxs/store';
import * as _ from 'lodash';

import { ICounterpartiesStateModel } from '../models/ICounterpartiesStateModel';
import { CounterpartiesState } from '../counterparties.state';

export const getContractors = createSelector([CounterpartiesState], (state: ICounterpartiesStateModel) =>
	_.map(state?.counterparties, i => i.nameNodes.join(': '))
);
