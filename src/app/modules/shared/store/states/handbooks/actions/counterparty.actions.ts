export class AddCounterParty {
	static readonly type = '[CounterpartiesHandbook] Add';
	constructor(public counterparty: string) {}
}
