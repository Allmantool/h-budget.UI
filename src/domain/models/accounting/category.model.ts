import { Guid } from 'typescript-guid';

import { OperationTypes } from './operation-types';

export interface CategoryModel {
	key: Guid;
	operationType: OperationTypes;
	nameNodes: string[];
}
