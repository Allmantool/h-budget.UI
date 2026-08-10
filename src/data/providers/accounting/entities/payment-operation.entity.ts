export interface IPaymentOperationEntity {
	key: string;
	operationDay: string;
	comment: string;
	contractorId: string;
	categoryId: string;
	paymentAccountId: string;
	relatedPaymentAccountId?: string;
	conversionMultiplier?: number;
	amount: number;
	transactionType: number;
}
