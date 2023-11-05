import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Mapper } from '@dynamic-mapper/angular';
import { Observable, map, retry, take } from 'rxjs';

import { Result } from 'core/result';
import { AppConfigurationService } from '../../../app/modules/shared/services/app-configuration.service';
import { CategoriesProvider } from '../../../domain/providers/accounting/categories.provider';
import { CategoryModel } from '../../../domain/models/accounting/category.model';
import { CategoryCreateRequest } from '../../../domain/models/accounting/requests/category-create.request';
import { CategoryEntity } from './entities/operation-category.entity';
import { DataCategoryProfile } from './mappers/category.mapping.profile';

@Injectable()
export class DefaultCategoriesProvider implements CategoriesProvider {
	private accountingHostUrl?: string;

	constructor(
		private readonly http: HttpClient,
		private readonly mapper: Mapper,
		private readonly appConfigurationService: AppConfigurationService
	) {
		this.accountingHostUrl = this.appConfigurationService.settings?.accountingHost;
	}

	public getCategoriries(): Observable<CategoryModel[]> {
		return this.http.get<Result<CategoryEntity[]>>(`${this.accountingHostUrl}/categories`).pipe(
			map(responseResult => this.mapper?.map(DataCategoryProfile.CategoryEntityToDomain, responseResult.payload)),
			retry(3),
			take(1)
		);
	}

	public getCategoryById(categoryId: string): Observable<CategoryModel> {
		return this.http.get<Result<CategoryEntity>>(`${this.accountingHostUrl}/categories/byId/${categoryId}`).pipe(
			map(responseResult => this.mapper?.map(DataCategoryProfile.CategoryEntityToDomain, responseResult.payload)),
			retry(3),
			take(1)
		);
	}

	public saveCategory(operationType: number, newCategoryNamesNodes: string[]): Observable<Result<string>> {
		const request: CategoryCreateRequest = {
			nameNodes: newCategoryNamesNodes,
			operationType: operationType,
		};

		return this.http.post<Result<string>>(`${this.accountingHostUrl}/categories`, request).pipe(retry(3), take(1));
	}
}
