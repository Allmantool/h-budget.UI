export interface PaymentAccountEntity {
	id: string;
	type: number;
	currency: string;
	balance: number;
	agent: string;
	description: string;
}
