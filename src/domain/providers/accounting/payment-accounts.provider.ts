import { Observable } from 'rxjs';

import { Result } from '../../../core/result';
import { IPaymentAccountModel } from '../../models/accounting/payment-account.model';

export interface IPaymentAccountsProvider {
	removePaymentAccount(accountGuid: string): Observable<Result<boolean>>;
	getPaymentAccounts(): Observable<IPaymentAccountModel[]>;
	getPaymentAccountById(paymentAccountId: string): Observable<IPaymentAccountModel>;
	savePaymentAccount(newPaymentAccount: IPaymentAccountModel): Observable<Result<string>>;
}
