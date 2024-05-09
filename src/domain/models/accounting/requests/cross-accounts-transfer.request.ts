import { Guid } from 'typescript-guid';

export interface ICrossAccountsTransferRequest {
	sender: Guid;
	recipient: Guid;
	amount: number;
	multiplier: number;
	operationAt: Date;
}
