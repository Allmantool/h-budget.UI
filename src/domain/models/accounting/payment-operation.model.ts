import { Guid } from 'typescript-guid';

import { OperationTypes } from '../../types/operation.types';

export interface IPaymentOperationModel {
	key: Guid;
	paymentAccountId: Guid;
	contractorId: Guid;
	categoryId: Guid;
	operationDate: Date;
	comment: string;
	amount: number;
	operationType?: OperationTypes;
}
