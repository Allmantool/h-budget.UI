export class SetActivePaymentAccount {
	static readonly type = '[Payment account] Set Active';
	constructor(public paymentAccountId: string) {}
}
