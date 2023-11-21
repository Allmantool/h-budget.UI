import { Observable } from 'rxjs';

import { Result } from 'core/result';

import { CategoryModel } from '../../models/accounting/category.model';

export interface CategoriesProvider {
	getCategoriries(): Observable<CategoryModel[]>;

	getCategoryById(categoryId: string): Observable<CategoryModel>;

	saveCategory(operationType: number, newCategoryNamesNodes: string[]): Observable<Result<string>>;
}
