import { Observable } from 'rxjs';
import { Guid } from 'typescript-guid';

import { Result } from '../../../core/result';
import { ICrossAccountsTransferModel } from '../../models/accounting/cross-accounts-transfer.model';

export interface ICrossAccountsTransferProvider {
	applyTransfer(payload: ICrossAccountsTransferModel): Observable<Result<Guid>>;

	deleteById(accountId: Guid, transferOperationId: Guid): Observable<Result<Guid>>;
}
