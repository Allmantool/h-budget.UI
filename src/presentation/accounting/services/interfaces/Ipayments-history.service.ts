import { Observable } from 'rxjs';
import { Guid } from 'typescript-guid';

import { IPaymentRepresentationModel } from '../../models/operation-record';

export interface IPaymentsHistoryService {
	refreshPaymentsHistory(paymentAccountId: string | Guid): Observable<IPaymentRepresentationModel[]>;

	paymentOperationAsHistoryRecord(): IPaymentRepresentationModel;
}
