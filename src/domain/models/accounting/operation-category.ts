import { AccountingOperationTypes } from './accounting-operation-types';

export interface OperationCategory {
	type: AccountingOperationTypes;
	value: string;
}
