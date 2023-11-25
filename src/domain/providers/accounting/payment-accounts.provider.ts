import { Observable } from 'rxjs';

import { Result } from '../../../core/result';
import { PaymentAccountModel } from '../../models/accounting/payment-account.model';

export interface PaymentAccountsProvider {
	removePaymentAccount(accountGuid: string): Observable<Result<boolean>>;
	getPaymentAccounts(): Observable<PaymentAccountModel[]>;
	getPaymentAccountById(paymentAccountId: string): Observable<PaymentAccountModel>;
	savePaymentAccount(newPaymentAccount: PaymentAccountModel): Observable<Result<string>>;
}
