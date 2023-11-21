import { Observable } from 'rxjs';

import { CurrencyGridRateModel } from 'presentation/currency-rates/models/currency-grid-rate.model';

import { Result } from '../../../core/result';
import { DaysRangePayload } from '../../models/dates-range-payload.model';
import { CurrencyRateGroupModel } from '../../models/rates/currency-rates-group.model';

export interface BankCurrencyProvider {
	getCurrenciesForSpecifiedPeriod(payload: DaysRangePayload): Observable<CurrencyRateGroupModel[]>;
	getTodayCurrencies(): Observable<CurrencyRateGroupModel[]>;
	getCurrencies(): Observable<CurrencyRateGroupModel[]>;
	saveCurrencies(rates: CurrencyGridRateModel[]): Observable<Result<number>>;
}
