export interface PaymentAccountCreateRequest {
	agent: string;
	balance: number;
	currencyAbbreviation: string;
	description: string;
	accountType: number;
}
