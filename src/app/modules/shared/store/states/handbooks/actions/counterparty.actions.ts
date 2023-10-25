import { ContractorModel } from 'domain/models/accounting/contractor.model.';

export class AddCounterParty {
	static readonly type = '[Counterparties handbook] Add';
	constructor(public counterparty: ContractorModel) {}
}

export class SetInitialContractors {
	static readonly type = '[Counterparties handbook] Set initial contractors';
	constructor(public contractors: ContractorModel[]) {}
}
