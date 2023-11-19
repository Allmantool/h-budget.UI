import { Guid } from 'typescript-guid';

export interface PaymentOperationModel {
	key?: Guid;
	operationDate: Date;
	comment: string;
	contractorId: string;
	categoryId: string;
	amount: number;
}
