export interface IPaymentAccountEntity {
	key: string;
	type: number;
	currency: string;
	balance: number;
	agent: string;
	description: string;
}
