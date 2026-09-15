import { IPaymentHistoryEntity } from './payment-history.entity';

export interface IPaymentHistoryPageEntity {
	items: IPaymentHistoryEntity[];
	page: number;
	pageSize: number;
	totalCount: number;
	totalPages: number;
	hasPreviousPage: boolean;
	hasNextPage: boolean;
}
