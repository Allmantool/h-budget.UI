import { Observable } from 'rxjs';

import { Result } from 'core/result';

import { ICategoryModel } from '../../models/accounting/category.model';

export interface ICategoriesProvider {
	getCategoriries(): Observable<ICategoryModel[]>;

	getCategoryById(categoryId: string): Observable<ICategoryModel>;

	saveCategory(operationType: number, newCategoryNamesNodes: string[]): Observable<Result<string>>;
}
