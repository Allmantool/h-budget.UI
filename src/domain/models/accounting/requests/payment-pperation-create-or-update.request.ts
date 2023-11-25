export interface PaymentOperationCreateOrUpdateRequest {
	amount: number;
	comment: string;
	contractorId: string;
	categoryId: string;
	operationDay: Date;
}
