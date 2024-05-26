export interface IPaymentAccountEntity {
	key: string;
	accountType: number;
	currency: string;
	balance: number;
	agent: string;
	description: string;
}
