import { Observable } from 'rxjs';

import { IPaymentRepresentationModel } from '../models/operation-record';

export interface IPaymentsHistoryService {
	refreshPaymentsHistory(paymentAccountId: string): Observable<IPaymentRepresentationModel[]>;
}
