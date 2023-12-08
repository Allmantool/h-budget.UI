import { IPaymentAccountModel } from 'domain/models/accounting/payment-account.model';

export interface IPaymenentAccountStateModel {
	activeAccountGuid: string;
	accounts: IPaymentAccountModel[];
}
