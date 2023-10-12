import { Guid } from 'typescript-guid';

import { AccountingGridRecord } from '../../../../../../../presentation/accounting/models/accounting-grid-record';

export class Add {
	static readonly type = '[Accounting] Add';
	constructor(public accountingRecord: AccountingGridRecord) {}
}

export class AddRange {
	static readonly type = '[Accounting] AddRange';
	constructor(public accountingRecord: AccountingGridRecord[]) {}
}

export class Delete {
	static readonly type = '[Accounting] Delete';
	constructor(public accountingGuid: Guid) {}
}

export class Edit {
	static readonly type = '[Accounting] Edit';
	constructor(public accountingRecord: AccountingGridRecord) {}
}
