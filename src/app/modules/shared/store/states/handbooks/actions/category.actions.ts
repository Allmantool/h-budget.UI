import { OperationCategory } from '../../../../../../../domain/models/accounting/operation-category.model';

export class AddCategory {
	static readonly type = '[CategoriesHandbook] Add';
	constructor(public category: OperationCategory) {}
}
