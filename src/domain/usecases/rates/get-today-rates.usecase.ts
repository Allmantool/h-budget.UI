import { CurrencyRateGroupModel } from 'domain/models/rates/currency-rates-group.model';
import { IBankCurrenciesProvider } from 'domain/providers/rates/bank-currencies.provider';

import { Observable } from 'rxjs';

import { IUseCase } from 'core/use-case';

export class GetTodayRatesUseCase implements IUseCase<void, CurrencyRateGroupModel[]> {
	constructor(private readonly ratesRepository: IBankCurrenciesProvider) {}

	execute(): Observable<CurrencyRateGroupModel[]> {
		return this.ratesRepository.getTodayCurrencies();
	}
}
