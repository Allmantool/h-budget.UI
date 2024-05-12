import { Guid } from 'typescript-guid';

export interface ICrossAccountsTransferResponse {
	paymentAccountIds: Guid[];
	paymentOperationId: Guid;
}
