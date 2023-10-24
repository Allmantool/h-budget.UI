import { Observable } from 'rxjs';

import { Result } from 'core/result';
import { ContractorModel } from 'domain/models/accounting/contractor.model.';
import { ContractorCreateRequest } from 'domain/models/accounting/requests/contractor-create.request';

export interface ContractorsProvider {
	getContractors(): Observable<ContractorModel[]>;

	saveContractor(request: ContractorCreateRequest): Observable<Result<string>>;
}
