export interface PaymentOperationEntity {
	key: string;
	operationDay: string;
	comment: string;
	contractorId: string;
	categoryId: string;
	paymentAccountId: string;
	amount: number;
}
