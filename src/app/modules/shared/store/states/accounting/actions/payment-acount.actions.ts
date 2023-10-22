import { PaymentAccountModel } from '../../../../../../../domain/models/accounting/payment-account';

export class SetActivePaymentAccount {
	static readonly type = '[Payment account] Set Active';
	constructor(public paymentAccountId: string) {}
}

export class AddPaymentAccounts {
	static readonly type = '[Payment account] Add payment accounts';
	constructor(public paymentAccounts: PaymentAccountModel[]) {}
}

export class SetInitialPaymentAccounts {
	static readonly type = '[Payment account] Set initial payment accounts';
	constructor(public paymentAccounts: PaymentAccountModel[]) {}
}

export class AddPaymentAccount {
	static readonly type = '[Payment account] Add payment account';
	constructor(public paymentAccount: PaymentAccountModel) {}
}

export class UpdatePaymentAccount {
	static readonly type = '[Payment account] Update payment account';
	constructor(public paymentAccount: PaymentAccountModel) {}
}

export class RemovePaymentAccount {
	static readonly type = '[Payment account] Remove payment account';
	constructor(public paymentAccountId: string) {}
}
