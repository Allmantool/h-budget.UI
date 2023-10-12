import { AccountingGridRecord } from '../../../../../../../presentation/accounting/models/accounting-grid-record';

export interface IAccountingOperationsStateModel {
	operationRecords: AccountingGridRecord[];
	activeCurrency: string;
}
