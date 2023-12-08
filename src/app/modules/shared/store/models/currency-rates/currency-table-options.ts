import { ICurrencyDateRange } from './currency-date-range';
import { ICurrencyTableItem } from './currency-table-item';

export interface ICurrencyTableOptions {
	selectedItem: ICurrencyTableItem;

	selectedDateRange: ICurrencyDateRange;
}
