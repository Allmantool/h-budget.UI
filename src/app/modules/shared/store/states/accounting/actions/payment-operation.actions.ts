import { Guid } from 'typescript-guid';

import { IPaymentOperationModel } from 'domain/models/accounting/payment-operation.model';

export class SetInitialPaymentOperations {
	static readonly type = '[Payment operation] Set initial payment operations';
	constructor(public paymentOperations: IPaymentOperationModel[]) {}
}

export class Add {
	static readonly type = '[Payment operation] Add';
	constructor(public paymentOperation: IPaymentOperationModel) {}
}

export class AddRange {
	static readonly type = '[Payment operation] AddRange';
	constructor(public paymentOperations: IPaymentOperationModel[]) {}
}

export class Delete {
	static readonly type = '[Payment operation] Delete';
	constructor(public paymentOperationId: Guid) {}
}

export class Edit {
	static readonly type = '[Payment operation] Edit';
	constructor(public paymentOperation: IPaymentOperationModel) {}
}
