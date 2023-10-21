import { PaymentAccountModel } from 'domain/models/accounting/payment-account';

export interface IPaymenentAccountStateModel {
	activeAccountGuid: string;
	paymentAccounts: PaymentAccountModel[];
}
