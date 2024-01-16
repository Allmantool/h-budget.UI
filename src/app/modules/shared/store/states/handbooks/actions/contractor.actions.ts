import { IContractorModel } from 'domain/models/accounting/contractor.model.';

export class AddCounterParty {
	static readonly type = '[Contractors handbook] Add';
	constructor(public newContractor: IContractorModel) {}
}

export class SetInitialContractors {
	static readonly type = '[Contractors handbook] Set initial contractors';
	constructor(public contractors: IContractorModel[]) {}
}
