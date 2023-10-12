import { createSelector } from '@ngxs/store';

import { CategoriesState } from '../categories.state';
import { ICategoriesStateModel } from '../models/ICategoriesStateModel';

export const getCategories = createSelector(
	[CategoriesState],
	(state: ICategoriesStateModel) => state?.categories
);
