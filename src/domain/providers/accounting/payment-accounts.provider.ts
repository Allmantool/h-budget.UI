import { Observable } from 'rxjs';

import { PaymentAccountModel } from '../../models/accounting/payment-account.model';
import { Result } from '../../../core/result';

export interface PaymentAccountsProvider {
	removePaymentAccount(accountGuid: string): Observable<Result<boolean>>;
	getPaymentAccounts(): Observable<PaymentAccountModel[]>;
	getPaymentAccountById(paymentAccountId: string): Observable<PaymentAccountModel>;
	savePaymentAccount(newPaymentAccount: PaymentAccountModel): Observable<Result<string>>;
}
