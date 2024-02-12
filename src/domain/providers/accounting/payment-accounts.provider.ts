import { Observable } from 'rxjs';
import { Guid } from 'typescript-guid';

import { Result } from '../../../core/result';
import { IPaymentAccountModel } from '../../models/accounting/payment-account.model';

export interface IPaymentAccountsProvider {
	removePaymentAccount(accountGuid: string): Observable<Result<boolean>>;
	getPaymentAccounts(): Observable<IPaymentAccountModel[]>;
	getById(paymentAccountId: string | Guid): Observable<IPaymentAccountModel>;
	savePaymentAccount(newPaymentAccount: IPaymentAccountModel): Observable<Result<string>>;
}
