import { IPaymentOperationEntity } from './payment-operation.entity';

export interface IPaymentHistoryEntity {
	record: IPaymentOperationEntity;
	balance: number;
}
