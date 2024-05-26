export interface IPaymentOperationEntity {
	key: string;
	operationDay: string;
	comment: string;
	contractorId: string;
	categoryId: string;
	paymentAccountId: string;
	amount: number;
	transactionType: number;
}
