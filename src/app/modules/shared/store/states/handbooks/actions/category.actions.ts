import { OperationCategory } from '../../../../../../../domain/models/accounting/operation-category';

export class AddCategory {
	static readonly type = '[CategoriesHandbook] Add';
	constructor(public category: OperationCategory) {}
}
