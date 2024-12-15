import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { Mapper } from '@dynamic-mapper/angular';
import { map, Observable, retry, take } from 'rxjs';

import { Result } from 'core/result';

import { ICategoryEntity } from './entities/operation-category.entity';
import { DataCategoryProfile } from './mappers/category.mapping.profile';
import { ApiRequestOptions } from '../../../app/modules/shared/constants/api-request-options';
import { AppConfigurationService } from '../../../app/modules/shared/services/app-configuration.service';
import { ICategoryModel } from '../../../domain/models/accounting/category.model';
import { ICategoryCreateRequest } from '../../../domain/models/accounting/requests/category-create.request';
import { ICategoriesProvider } from '../../../domain/providers/accounting/categories.provider';

@Injectable()
export class DefaultCategoriesProvider implements ICategoriesProvider {
	private accountingHostUrl?: string;
	private paymentCategoriesApi: string = 'accounting/categories';

	constructor(
		private readonly http: HttpClient,
		private readonly mapper: Mapper,
		private readonly appConfigurationService: AppConfigurationService
	) {
		this.accountingHostUrl = this.appConfigurationService.settings?.gatewayHost;
	}

	public getCategoriries(): Observable<ICategoryModel[]> {
		return this.http.get<Result<ICategoryEntity[]>>(`${this.accountingHostUrl}/${this.paymentCategoriesApi}`).pipe(
			map(responseResult => this.mapper?.map(DataCategoryProfile.CategoryEntityToDomain, responseResult.payload)),
			retry(ApiRequestOptions.RETRY_AMOUNT),
			take(1)
		);
	}

	public getCategoryById(categoryId: string): Observable<ICategoryModel> {
		return this.http
			.get<Result<ICategoryEntity>>(`${this.accountingHostUrl}/${this.paymentCategoriesApi}/byId/${categoryId}`)
			.pipe(
				map(responseResult =>
					this.mapper?.map(DataCategoryProfile.CategoryEntityToDomain, responseResult.payload)
				),
				retry(ApiRequestOptions.RETRY_AMOUNT),
				take(1)
			);
	}

	public saveCategory(operationType: number, newCategoryNamesNodes: string[]): Observable<Result<string>> {
		const request: ICategoryCreateRequest = {
			nameNodes: newCategoryNamesNodes,
			categoryType: operationType,
		};

		return this.http
			.post<Result<string>>(`${this.accountingHostUrl}/${this.paymentCategoriesApi}`, request)
			.pipe(retry(ApiRequestOptions.RETRY_AMOUNT), take(1));
	}
}
