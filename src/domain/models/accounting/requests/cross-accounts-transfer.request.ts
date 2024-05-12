export interface ICrossAccountsTransferRequest {
	sender: string;
	recipient: string;
	amount: number;
	multiplier: number;
	operationAt: string;
}
