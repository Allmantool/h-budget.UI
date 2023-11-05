import { Guid } from 'typescript-guid';

export interface CategoryEntity {
	id: Guid;
	nameNodes: string[];
	operationType: number;
}
