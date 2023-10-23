import { Observable } from 'rxjs';

import { Result } from 'core/result';
import { ContractorModel } from 'domain/models/accounting/contractor.model.';

export interface ContractorsProvider {
	getContractors(): Observable<ContractorModel[]>;

	saveContractor(newContractor: ContractorModel): Observable<Result<string>>;
}
