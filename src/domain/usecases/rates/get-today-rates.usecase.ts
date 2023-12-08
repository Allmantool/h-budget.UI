import { Observable } from 'rxjs';

import { CurrencyRateGroupModel } from 'domain/models/rates/currency-rates-group.model';
import { IBankCurrenciesProvider } from 'domain/providers/rates/bank-currencies.provider';
import { UseCase } from 'domain/use-case';

export class GetTodayRatesUseCase implements UseCase<{}, CurrencyRateGroupModel[]> {
	constructor(private readonly ratesRepository: IBankCurrenciesProvider) {}

	execute(): Observable<CurrencyRateGroupModel[]> {
		return this.ratesRepository.getTodayCurrencies();
	}
}
