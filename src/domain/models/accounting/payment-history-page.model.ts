import { IPaymentHistoryModel } from './payment-history.model';

export interface IPaymentHistoryPageModel {
	items: IPaymentHistoryModel[];
	page: number;
	pageSize: number;
	totalCount: number;
	totalPages: number;
	hasPreviousPage: boolean;
	hasNextPage: boolean;
}
