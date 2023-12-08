import { IAccountingGridRecord } from '../../../../../../../presentation/accounting/models/accounting-grid-record';

export interface IAccountingOperationsStateModel {
	operationRecords: IAccountingGridRecord[];
	activeCurrency: string;
}
