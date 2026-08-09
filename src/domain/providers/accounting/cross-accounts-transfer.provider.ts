import { Observable } from 'rxjs';
import { Guid } from 'typescript-guid';

import { Result } from '../../../core/result';
import { ICrossAccountsTransferModel } from '../../models/accounting/cross-accounts-transfer.model';
import { ICrossAccountsTransferResponse } from '../../models/accounting/responses/cross-accounts-transfer.response';

export interface ICrossAccountsTransferProvider {
	applyTransfer(payload: ICrossAccountsTransferModel): Observable<Result<ICrossAccountsTransferResponse>>;

	deleteById(accountId: Guid, transferOperationId: Guid): Observable<Result<Guid>>;
}
