export interface IPaymentOperationCreateOrUpdateRequest {
	amount: number;
	comment: string;
	contractorId: string;
	categoryId: string;
	operationDate: string;
}
