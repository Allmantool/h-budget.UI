import { Guid } from 'typescript-guid';

export interface IPaymentOperationModel {
	key: Guid;
	operationDate: Date;
	contractorId: Guid;
	categoryId: Guid;
	paymentAccountId: Guid;
	comment: string;
	amount: number;
}
