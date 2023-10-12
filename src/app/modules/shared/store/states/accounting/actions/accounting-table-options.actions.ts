import { Guid } from 'typescript-guid';

export class SetActiveAccountingOperation {
	static readonly type = '[Accounting] Set active accounting operation';
	constructor(public id: Guid) {}
}
