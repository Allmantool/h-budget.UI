export type PaymentHistorySortBy = 'date' | 'amount';
export type PaymentHistorySortDirection = 'asc' | 'desc';

export interface IPaymentHistoryQueryModel {
	page: number;
	pageSize: 10 | 25 | 50 | 100;
	sortBy: PaymentHistorySortBy;
	sortDirection: PaymentHistorySortDirection;
	dateFrom?: string;
	dateTo?: string;
	type?: 'income' | 'expense';
	categoryId?: string;
	contractorId?: string;
	amountMin?: number;
	amountMax?: number;
}

export const defaultPaymentHistoryQuery: IPaymentHistoryQueryModel = {
	page: 1,
	pageSize: 25,
	sortBy: 'date',
	sortDirection: 'desc',
};
