import _ from 'lodash';

import { createSelector } from '@ngxs/store';

import { CategoriesState } from '../categories.state';
import { ICategoriesStateModel } from '../models/ICategoriesStateModel';

export const getCategories = createSelector([CategoriesState], (state: ICategoriesStateModel) =>
	_.map(state?.categories, i => i.nameNodes.join(': '))
);
