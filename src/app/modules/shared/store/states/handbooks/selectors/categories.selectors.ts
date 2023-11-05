import { createSelector } from '@ngxs/store';

import _ from 'lodash';

import { CategoriesState } from '../categories.state';
import { ICategoriesStateModel } from '../models/ICategoriesStateModel';

export const getCategories = createSelector([CategoriesState], (state: ICategoriesStateModel) =>
	_.map(state?.categories, i => i.nameNodes.join(': '))
);
