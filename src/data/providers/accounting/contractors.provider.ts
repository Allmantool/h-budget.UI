import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Mapper } from '@dynamic-mapper/angular';
import { Observable, map, of, retry, take } from 'rxjs';

import { Result } from 'core/result';
import { ContractorsProvider } from 'domain/providers/accounting/contractors.provider';
import { ContractorModel } from '../../../domain/models/accounting/contractor.model.';
import { ContractorEntity } from './entities/contractor-entity';
import { DataContractorProfile } from './mappers/contractor.mapping.profile';
import { RoutesSegments } from '../../../app/modules/shared/constants/routes-segments';

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

	public saveContractor(newContractor: ContractorModel): Observable<Result<string>> {
		console.log(newContractor);
		return of();
	}
}
