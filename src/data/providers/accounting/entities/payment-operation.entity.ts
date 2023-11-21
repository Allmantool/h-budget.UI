export interface PaymentOperationEntity {
	key: string;
	operationDate: string;
	comment: string;
	contractorId: string;
	categoryId: string;
	paymentAccountId: string;
	amount: number;
}
