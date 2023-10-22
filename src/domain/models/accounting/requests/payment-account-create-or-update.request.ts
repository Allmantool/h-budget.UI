export interface PaymentAccountCreateOrUpdateRequest {
	agent: string;
	balance: number;
	currency: string;
	description: string;
	accountType: number;
}
