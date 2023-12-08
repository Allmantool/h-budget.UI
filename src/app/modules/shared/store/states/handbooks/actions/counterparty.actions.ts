import { IContractorModel } from 'domain/models/accounting/contractor.model.';

export class AddCounterParty {
	static readonly type = '[Counterparties handbook] Add';
	constructor(public counterparty: IContractorModel) {}
}

export class SetInitialContractors {
	static readonly type = '[Counterparties handbook] Set initial contractors';
	constructor(public contractors: IContractorModel[]) {}
}
