import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Mapper } from '@dynamic-mapper/angular';
import { Observable, map, retry, take } from 'rxjs';

import { Result } from 'core/result';
import { ContractorsProvider } from 'domain/providers/accounting/contractors.provider';
import { ContractorModel } from '../../../domain/models/accounting/contractor.model.';
import { ContractorEntity } from './entities/contractor-entity';
import { DataContractorProfile } from './mappers/contractor.mapping.profile';
import { RoutesSegments } from '../../../app/modules/shared/constants/routes-segments';
import { ContractorCreateRequest } from 'domain/models/accounting/requests/contractor-create.request';

@Injectable()
export class DefaultContractorsProvider implements ContractorsProvider {
	constructor(
		private readonly http: HttpClient,
		private readonly mapper: Mapper
	) {}

	public getContractors(): Observable<ContractorModel[]> {
		return this.http
			.get<Result<ContractorEntity[]>>(`${RoutesSegments.HOME_BUDGET_ACCOUNTING_HOST}/contractors`)
			.pipe(
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
			.get<Result<ContractorEntity>>(
				`${RoutesSegments.HOME_BUDGET_ACCOUNTING_HOST}/contractors/byId/${contractorId}`
			)
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

		return this.http
			.post<Result<string>>(`${RoutesSegments.HOME_BUDGET_ACCOUNTING_HOST}/contractors`, request)
			.pipe(retry(3), take(1));
	}
}