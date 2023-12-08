import { Observable } from 'rxjs';

import { IUseCase } from 'core/use-case';

import { DaysRangePayload } from 'domain/models/dates-range-payload.model';
import { CurrencyRateGroupModel } from 'domain/models/rates/currency-rates-group.model';
import { IBankCurrenciesProvider } from 'domain/providers/rates/bank-currencies.provider';

export class GetRatesForPeriodUseCase
	implements IUseCase<{ requestPayload: DaysRangePayload }, CurrencyRateGroupModel[]>
{
	constructor(private readonly ratesRepository: IBankCurrenciesProvider) {}

	execute(params: { requestPayload: DaysRangePayload }): Observable<CurrencyRateGroupModel[]> {
		return this.ratesRepository.getCurrenciesForSpecifiedPeriod(params.requestPayload);
	}
}
