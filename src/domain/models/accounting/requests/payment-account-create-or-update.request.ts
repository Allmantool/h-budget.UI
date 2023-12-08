export interface IPaymentAccountCreateOrUpdateRequest {
	agent: string;
	balance: number;
	currency: string;
	description: string;
	accountType: number;
}
