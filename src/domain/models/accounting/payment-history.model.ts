import { IPaymentOperationModel } from './payment-operation.model';

export interface IPaymentHistoryModel {
	record: IPaymentOperationModel;
	balance: number;
}
