import { IPaymentOperationModel } from '../../../../../../../domain/models/accounting/payment-operation.model';

export interface IAccountingOperationsStateModel {
	operationRecords: IPaymentOperationModel[];
	activeCurrency: string;
}
