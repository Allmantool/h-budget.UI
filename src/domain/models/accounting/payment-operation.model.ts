import { Guid } from 'typescript-guid';

export interface PaymentOperationModel {
	key: Guid;
	operationDate: Date;
	comment: string;
	contractorId: Guid;
	categoryId: Guid;
	paymentAccountId: Guid;
	amount: number;
}