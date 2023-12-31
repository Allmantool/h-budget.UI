import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { Mapper } from '@dynamic-mapper/angular';
import { map, Observable, retry, take } from 'rxjs';

import { Result } from 'core/result';

import { ICategoryEntity } from './entities/operation-category.entity';
import { DataCategoryProfile } from './mappers/category.mapping.profile';
import { AppConfigurationService } from '../../../app/modules/shared/services/app-configuration.service';
import { ICategoryModel } from '../../../domain/models/accounting/category.model';
import { ICategoryCreateRequest } from '../../../domain/models/accounting/requests/category-create.request';
import { ICategoriesProvider } from '../../../domain/providers/accounting/categories.provider';

@Injectable()
export class DefaultCategoriesProvider implements ICategoriesProvider {
	private accountingHostUrl?: string;

	constructor(
		private readonly http: HttpClient,
		private readonly mapper: Mapper,
		private readonly appConfigurationService: AppConfigurationService
	) {
		this.accountingHostUrl = this.appConfigurationService.settings?.accountingHost;
	}

	public getCategoriries(): Observable<ICategoryModel[]> {
		return this.http.get<Result<ICategoryEntity[]>>(`${this.accountingHostUrl}/categories`).pipe(
			map(responseResult => this.mapper?.map(DataCategoryProfile.CategoryEntityToDomain, responseResult.payload)),
			retry(3),
			take(1)
		);
	}

	public getCategoryById(categoryId: string): Observable<ICategoryModel> {
		return this.http.get<Result<ICategoryEntity>>(`${this.accountingHostUrl}/categories/byId/${categoryId}`).pipe(
			map(responseResult => this.mapper?.map(DataCategoryProfile.CategoryEntityToDomain, responseResult.payload)),
			retry(3),
			take(1)
		);
	}

	public saveCategory(operationType: number, newCategoryNamesNodes: string[]): Observable<Result<string>> {
		const request: ICategoryCreateRequest = {
			nameNodes: newCategoryNamesNodes,
			categoryType: operationType,
		};

		return this.http.post<Result<string>>(`${this.accountingHostUrl}/categories`, request).pipe(retry(3), take(1));
	}
}
