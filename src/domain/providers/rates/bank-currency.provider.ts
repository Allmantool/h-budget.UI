import { Observable } from 'rxjs';

import { Result } from '../../../core/result';
import { CurrencyRateGroupModel } from '../../models/rates/currency-rates-group.model';
import { DaysRangePayload } from '../../models/dates-range-payload.model';
import { CurrencyGridRateModel } from 'presentation/currency-rates/models/currency-grid-rate.model';

export interface BankCurrencyProvider {
	getCurrenciesForSpecifiedPeriod(
		payload: DaysRangePayload
	): Observable<CurrencyRateGroupModel[]>;
	getTodayCurrencies(): Observable<CurrencyRateGroupModel[]>;
	getCurrencies(): Observable<CurrencyRateGroupModel[]>;
	saveCurrencies(rates: CurrencyGridRateModel[]): Observable<Result<number>>;
}
