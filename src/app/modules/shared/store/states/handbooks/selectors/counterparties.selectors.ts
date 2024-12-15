import * as _ from 'lodash';

import { createSelector } from '@ngxs/store';

import { ContractorsState } from '../contractors.state';
import { IContractorsStateModel } from '../models/IContractorsStateModel';

export const getContractors = createSelector([ContractorsState], (state: IContractorsStateModel) => state?.contractors);

export const getContractorNodes = createSelector([ContractorsState], (state: IContractorsStateModel) =>
	_.map(state?.contractors, i => i.nameNodes?.parseToTreeAsString())
);

export const getContractorAsNodesMap = createSelector(
	[ContractorsState],
	(state: IContractorsStateModel) => new Map(state?.contractors.map(c => [c.nameNodes?.parseToTreeAsString(), c]))
);
