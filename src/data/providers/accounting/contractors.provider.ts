import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { Mapper } from '@dynamic-mapper/angular';
import { map, Observable, retry, take } from 'rxjs';

import { Result } from 'core/result';

import { IContractorEntity } from './entities/contractor.entity';
import { DataContractorProfile } from './mappers/contractor.mapping.profile';
import { ApiRequestOptions } from '../../../app/modules/shared/constants/api-request-options';
import { AppConfigurationService } from '../../../app/modules/shared/services/app-configuration.service';
import { IContractorModel } from '../../../domain/models/accounting/contractor.model.';
import { IContractorCreateRequest } from '../../../domain/models/accounting/requests/contractor-create.request';
import { IContractorsProvider } from '../../../domain/providers/accounting/contractors.provider';

@Injectable()
export class DefaultContractorsProvider implements IContractorsProvider {
	private accountingHostUrl?: string;
	private paymentContractorsApi: string = 'accounting/contractors';

	constructor(
		private readonly http: HttpClient,
		private readonly mapper: Mapper,
		private readonly appConfigurationService: AppConfigurationService
	) {
		this.accountingHostUrl = this.appConfigurationService.settings?.gatewayHost;
	}

	public getContractors(): Observable<IContractorModel[]> {
		return this.http
			.get<Result<IContractorEntity[]>>(`${this.accountingHostUrl}/${this.paymentContractorsApi}`)
			.pipe(
				map(responseResult =>
					this.mapper?.map(DataContractorProfile.ContractorEntityToDomain, responseResult.payload)
				),
				retry(ApiRequestOptions.RETRY_AMOUNT),
				take(1)
			);
	}

	public getContractorById(contractorId: string): Observable<IContractorModel> {
		return this.http
			.get<
				Result<IContractorEntity>
			>(`${this.accountingHostUrl}/${this.paymentContractorsApi}/byId/${contractorId}`)
			.pipe(
				map(responseResult =>
					this.mapper?.map(DataContractorProfile.ContractorEntityToDomain, responseResult.payload)
				),
				retry(ApiRequestOptions.RETRY_AMOUNT),
				take(1)
			);
	}

	public saveContractor(newContractorNamesNodes: string[]): Observable<Result<string>> {
		const request: IContractorCreateRequest = {
			nameNodes: newContractorNamesNodes,
		};

		return this.http
			.post<Result<string>>(`${this.accountingHostUrl}/${this.paymentContractorsApi}`, request)
			.pipe(retry(ApiRequestOptions.RETRY_AMOUNT), take(1));
	}
}
