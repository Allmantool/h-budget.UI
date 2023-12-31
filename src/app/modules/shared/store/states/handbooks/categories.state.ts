import { Injectable } from '@angular/core';

import * as _ from 'lodash';

import { Action, State, StateContext } from '@ngxs/store';
import { nameof } from 'ts-simple-nameof';

import { AddCategory, SetInitialCategories } from './actions/category.actions';
import { ICategoriesStateModel } from './models/ICategoriesStateModel';
import { ICategoryModel } from '../../../../../../domain/models/accounting/category.model';

@State<ICategoriesStateModel>({
	name: 'categoriesHandbook',
	defaults: {
		categories: [],
	},
	children: [],
})
@Injectable()
export class CategoriesState {
	@Action(AddCategory)
	AddCategory({ getState, patchState }: StateContext<ICategoriesStateModel>, { category }: AddCategory): void {
		const newCategoriesState = [...getState().categories];

		newCategoriesState.push(category);

		const orderedCategories = _.orderBy(
			[...newCategoriesState],
			nameof<ICategoryModel>(op => op.nameNodes),
			['asc']
		);

		patchState({
			categories: [...orderedCategories],
		});
	}

	@Action(SetInitialCategories)
	setInitialCategories(
		{ patchState }: StateContext<ICategoriesStateModel>,
		{ categories }: SetInitialCategories
	): void {
		patchState({
			categories: [...categories],
		});
	}
}
