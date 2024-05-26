import { Injectable } from '@angular/core';

import _ from 'lodash';

import { Store } from '@ngxs/store';
import { combineLatest, filter, take } from 'rxjs';

import { SetInitialCategories } from '../../../app/modules/shared/store/states/handbooks/actions/category.actions';
import { SetInitialContractors } from '../../../app/modules/shared/store/states/handbooks/actions/contractor.actions';
import { DefaultCategoriesProvider } from '../../../data/providers/accounting/categories.provider';
import { DefaultContractorsProvider } from '../../../data/providers/accounting/contractors.provider';

@Injectable()
export class HandbooksService {
	constructor(
		private readonly store: Store,
		private readonly categoriesProvider: DefaultCategoriesProvider,
		private readonly contractorsProvider: DefaultContractorsProvider
	) {}

	public setupHandbooksStore() {
		const inquireContractors$ = this.contractorsProvider.getContractors().pipe(take(1));
		const inquireCategories$ = this.categoriesProvider.getCategoriries().pipe(take(1));

		return combineLatest([inquireCategories$, inquireContractors$])
			.pipe(
				take(1),
				filter(([categories, contractors]) => !_.isNil(categories) && !_.isNil(contractors))
			)
			.subscribe(([categories, contractors]) => {
				this.store.dispatch(new SetInitialContractors(contractors));
				this.store.dispatch(new SetInitialCategories(categories));
			});
	}
}
