import { Guid } from 'typescript-guid';

import { PaymentOperationTypes } from './operation-types';

export interface ICategoryModel {
	key: Guid;
	operationType: PaymentOperationTypes;
	nameNodes: string[];
}
