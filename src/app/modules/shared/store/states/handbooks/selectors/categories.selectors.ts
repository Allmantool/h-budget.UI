import _ from 'lodash';

import { createSelector } from '@ngxs/store';

import { CategoriesState } from '../categories.state';
import { ICategoriesStateModel } from '../models/ICategoriesStateModel';

export const getCategories = createSelector([CategoriesState], (state: ICategoriesStateModel) => state?.categories);

export const getCategoryNodes = createSelector([CategoriesState], (state: ICategoriesStateModel) =>
	_.map(state?.categories, i => i.nameNodes.join(': '))
);

export const getCategoryAsNodesMap = createSelector(
	[CategoriesState],
	(state: ICategoriesStateModel) => new Map(state?.categories.map(c => [c.nameNodes?.parseToTreeAsString(), c]))
);
