import { IPaymentAccountModel } from '../../../../../../../domain/models/accounting/payment-account.model';

export class SetActivePaymentAccount {
	static readonly type = '[Payment account] Set Active';
	constructor(public paymentAccountId: string) {}
}

export class AddPaymentAccounts {
	static readonly type = '[Payment account] Add payment accounts';
	constructor(public paymentAccounts: IPaymentAccountModel[]) {}
}

export class SetInitialPaymentAccounts {
	static readonly type = '[Payment account] Set initial payment accounts';
	constructor(public paymentAccounts: IPaymentAccountModel[]) {}
}

export class AddPaymentAccount {
	static readonly type = '[Payment account] Add payment account';
	constructor(public paymentAccount: IPaymentAccountModel) {}
}

export class UpdatePaymentAccount {
	static readonly type = '[Payment account] Update payment account';
	constructor(public paymentAccount: IPaymentAccountModel) {}
}

export class RemovePaymentAccount {
	static readonly type = '[Payment account] Remove payment account';
	constructor(public paymentAccountId: string) {}
}
