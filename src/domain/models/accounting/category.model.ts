import { Guid } from 'typescript-guid';

import { OperationTypes } from './operation-types';

export interface CategoryModel {
	id: Guid;
	operationType: OperationTypes;
	nameNodes: string[];
}
