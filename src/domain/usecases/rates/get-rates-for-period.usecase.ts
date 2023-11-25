import { Observable } from 'rxjs';

import { UseCase } from 'core/use-case';

import { DaysRangePayload } from 'domain/models/dates-range-payload.model';
import { CurrencyRateGroupModel } from 'domain/models/rates/currency-rates-group.model';
import { BankCurrencyProvider } from 'domain/providers/rates/bank-currency.provider';

export class GetRatesForPeriodUseCase
	implements UseCase<{ requestPayload: DaysRangePayload }, CurrencyRateGroupModel[]>
{
	constructor(private readonly ratesRepository: BankCurrencyProvider) {}

	execute(params: { requestPayload: DaysRangePayload }): Observable<CurrencyRateGroupModel[]> {
		return this.ratesRepository.getCurrenciesForSpecifiedPeriod(params.requestPayload);
	}
}
