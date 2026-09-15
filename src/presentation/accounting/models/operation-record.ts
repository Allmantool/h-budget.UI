import { Guid } from 'typescript-guid';

import { OperationTypes } from '../../../domain/types/operation.types';

export interface IPaymentRepresentationModel {
	key: Guid;
	operationDate: Date;
	contractor: string;
	category: string;
	income: number;
	expense: number;
	comment: string;
	balance: number;
	operationType: OperationTypes;
	relatedPaymentAccountId?: Guid;
	relatedPaymentAccountName?: string;
	conversionMultiplier?: number;
	conversionSourceCurrency?: string;
	conversionDestinationCurrency?: string;
}
