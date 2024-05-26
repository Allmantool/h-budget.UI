import { Guid } from 'typescript-guid';

export interface ICrossAccountsTransferModel {
	sender: Guid;
	recipient: Guid;
	amount: number;
	multiplier: number;
	operationAt: Date;
}
