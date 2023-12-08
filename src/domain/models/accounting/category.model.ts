import { Guid } from 'typescript-guid';

import { OperationTypes } from './operation-types';

export interface ICategoryModel {
	key: Guid;
	operationType: OperationTypes;
	nameNodes: string[];
}
