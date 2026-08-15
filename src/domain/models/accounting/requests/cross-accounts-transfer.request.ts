export interface ICrossAccountsTransferRequest {
	sender: string;
	recipient: string;
	amount: number;
	multiplier: number;
	customConversionMultiplier?: number;
	operationAt: string;
}
