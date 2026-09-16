import { Observable } from 'rxjs';

import { IPaymentAccountModel } from '../../../domain/models/accounting/payment-account.model';

export interface PaymentAccountDeleteDialogData {
	readonly account: IPaymentAccountModel;
	readonly deleteAccount: () => Observable<void>;
}
