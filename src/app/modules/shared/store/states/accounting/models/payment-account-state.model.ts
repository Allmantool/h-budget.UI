import { IPaymentAccountModel } from 'domain/models/accounting/payment-account.model';

export interface IPaymentAccountStateModel {
	activeAccountGuid: string;
	accounts: IPaymentAccountModel[];
}
