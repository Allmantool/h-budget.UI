import { Observable } from 'rxjs';

import { CurrencyRateGroupModel } from 'domain/models/rates/currency-rates-group.model';
import { BankCurrencyProvider } from 'domain/providers/rates/bank-currency.provider';
import { UseCase } from 'domain/use-case';

export class GetTodayRatesUseCase
	implements UseCase<{}, CurrencyRateGroupModel[]>
{
	constructor(private readonly ratesRepository: BankCurrencyProvider) {}

	execute(): Observable<CurrencyRateGroupModel[]> {
		return this.ratesRepository.getTodayCurrencies();
	}
}
