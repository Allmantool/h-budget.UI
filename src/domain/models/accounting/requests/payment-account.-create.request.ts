export interface PaymentAccountCreateRequest {
	agent: string;
	balance: number;
	currency: string;
	description: string;
	accountType: number;
}
