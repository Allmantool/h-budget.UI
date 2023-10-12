import { CurrencyRateGroupModel } from 'domain/models/rates/currency-rates-group.model';

export interface ICurrencyRatesStateModel {
	rateGroups: CurrencyRateGroupModel[];
}
