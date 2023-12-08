import { Observable } from 'rxjs';

import { Result } from 'core/result';

import { IContractorModel } from 'domain/models/accounting/contractor.model.';

export interface IContractorsProvider {
	getContractors(): Observable<IContractorModel[]>;

	getContractorById(contractorId: string): Observable<IContractorModel>;

	saveContractor(newContractorNamesNodes: string[]): Observable<Result<string>>;
}
