import { Observable } from 'rxjs';

import { PaymentAccountModel } from '../../models/accounting/payment-account';
import { Result } from '../../../core/result';

export interface PaymentAccountsProvider {
	getPaymentAccounts(): Observable<PaymentAccountModel[]>;

	savePaymentAccount(newPaymentAccount: PaymentAccountModel): Observable<Result<string>>;
}
