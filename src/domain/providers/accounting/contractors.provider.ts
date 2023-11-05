import { Observable } from 'rxjs';

import { Result } from 'core/result';
import { ContractorModel } from 'domain/models/accounting/contractor.model.';

export interface ContractorsProvider {
	getContractors(): Observable<ContractorModel[]>;

	getContractorById(contractorId: string): Observable<ContractorModel>;

	saveContractor(newContractorNamesNodes: string[]): Observable<Result<string>>;
}
