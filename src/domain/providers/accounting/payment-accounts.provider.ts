import { Observable } from 'rxjs';

import { PaymentAccountModel } from '../../models/accounting/payment-account';

export interface PaymentAccountsProvider {
	getPaymentAccounts(): Observable<PaymentAccountModel[]>;
}
