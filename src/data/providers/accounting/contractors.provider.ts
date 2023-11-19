import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Mapper } from '@dynamic-mapper/angular';
import { Observable, map, retry, take } from 'rxjs';

import { Result } from 'core/result';
import { ContractorsProvider } from 'domain/providers/accounting/contractors.provider';
import { ContractorModel } from '../../../domain/models/accounting/contractor.model.';
import { ContractorEntity } from './entities/contractor.entity';
import { DataContractorProfile } from './mappers/contractor.mapping.profile';
import { ContractorCreateRequest } from 'domain/models/accounting/requests/contractor-create.request';
import { AppConfigurationService } from '../../../app/modules/shared/services/app-configuration.service';

@Injectable()
export class DefaultContractorsProvider implements ContractorsProvider {
	private accountingHostUrl?: string;

	constructor(
		private readonly http: HttpClient,
		private readonly mapper: Mapper,
		private readonly appConfigurationService: AppConfigurationService
	) {
		this.accountingHostUrl = this.appConfigurationService.settings?.accountingHost;
	}

	public getContractors(): Observable<ContractorModel[]> {
		return this.http.get<Result<ContractorEntity[]>>(`${this.accountingHostUrl}/contractors`).pipe(
			map(
				responseResult =>
					this.mapper?.map(DataContractorProfile.ContractorEntityToDomain, responseResult.payload)
			),
			retry(3),
			take(1)
		);
	}

	public getContractorById(contractorId: string): Observable<ContractorModel> {
		return this.http
			.get<Result<ContractorEntity>>(`${this.accountingHostUrl}/contractors/byId/${contractorId}`)
			.pipe(
				map(
					responseResult =>
						this.mapper?.map(DataContractorProfile.ContractorEntityToDomain, responseResult.payload)
				),
				retry(3),
				take(1)
			);
	}

	public saveContractor(newContractorNamesNodes: string[]): Observable<Result<string>> {
		const request: ContractorCreateRequest = {
			nameNodes: newContractorNamesNodes,
		};

		return this.http.post<Result<string>>(`${this.accountingHostUrl}/contractors`, request).pipe(retry(3), take(1));
	}
}
