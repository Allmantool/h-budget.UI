export interface IPaymentAccountCreateOrUpdateRequest {
	agent: string;
	initialBalance: number;
	currency: string;
	description: string;
	accountType: number;
}
