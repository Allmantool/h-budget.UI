import { Guid } from 'typescript-guid';

import { AccountingGridRecord } from '../../../../../../../presentation/accounting/models/accounting-grid-record';

export class SetInitialPaymentOperations {
	static readonly type = '[Payment operation] Set initial payment operations';
	constructor(public paymentOperations: AccountingGridRecord[]) {}
}

export class Add {
	static readonly type = '[Payment operation] Add';
	constructor(public accountingRecord: AccountingGridRecord) {}
}

export class AddRange {
	static readonly type = '[Payment operation] AddRange';
	constructor(public accountingRecord: AccountingGridRecord[]) {}
}

export class Delete {
	static readonly type = '[Payment operation] Delete';
	constructor(public accountingGuid: Guid) {}
}

export class Edit {
	static readonly type = '[Payment operation] Edit';
	constructor(public accountingRecord: AccountingGridRecord) {}
}
