import { Observable } from 'rxjs';

import { Result } from '../../../core/result';
import { CurrencyGridRateModel } from '../../../presentation/currency-rates/models/currency-grid-rate.model';
import { DaysRangePayload } from '../../models/dates-range-payload.model';
import { CurrencyRateGroupModel } from '../../models/rates/currency-rates-group.model';

export interface BankCurrenciesProvider {
	getCurrenciesForSpecifiedPeriod(payload: DaysRangePayload): Observable<CurrencyRateGroupModel[]>;
	getTodayCurrencies(): Observable<CurrencyRateGroupModel[]>;
	getCurrencies(): Observable<CurrencyRateGroupModel[]>;
	saveCurrencies(rates: CurrencyGridRateModel[]): Observable<Result<number>>;
}
