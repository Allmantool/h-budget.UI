import { Guid } from 'typescript-guid';

export interface IPaymentOperationModel {
	key: Guid;
	paymentAccountId: Guid;
	contractorId: Guid;
	categoryId: Guid;
	operationDate: Date;
	comment: string;
	amount: number;
}
