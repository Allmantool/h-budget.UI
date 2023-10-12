import { CurrencyDateRange } from './currency-date-range';
import { CurrencyTableItem } from './currency-table-item';

export interface CurrencyTableOptions {
	selectedItem: CurrencyTableItem;

	selectedDateRange: CurrencyDateRange;
}
