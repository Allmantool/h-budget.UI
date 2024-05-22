import { Guid } from 'typescript-guid';

export interface IPaymentRepresentationModel {
	key: Guid;
	operationDate: Date;
	contractor: string;
	category: string;
	income: number;
	expense: number;
	comment: string;
	balance: number;
	operationType: number;
}
