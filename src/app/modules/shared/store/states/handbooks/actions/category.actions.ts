import { ICategoryModel } from '../../../../../../../domain/models/accounting/category.model';

export class AddCategory {
	static readonly type = '[Categories handbook] Add';
	constructor(public category: ICategoryModel) {}
}

export class SetInitialCategories {
	static readonly type = '[Categories handbook] Set initial categories';
	constructor(public categories: ICategoryModel[]) {}
}
