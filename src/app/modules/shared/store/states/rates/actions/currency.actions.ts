import { CurrencyRateGroupModel } from '../../../../../../../domain/models/rates/currency-rates-group.model';

export class Add {
	static readonly type = '[CURR-RATE-GROUP] Add currency group';
	constructor(public rateGroup: CurrencyRateGroupModel) {}
}

export class AddCurrencyGroups {
	static readonly type = '[CURR-RATES-GROUP] Add currency groups';
	constructor(public addedRateGroups: CurrencyRateGroupModel[]) {}
}

export class Edit {
	static readonly type = '[CURR-RATES-GROUP] Edit currency group';
	constructor(public rateGroup: CurrencyRateGroupModel) {}
}

export class FetchAllCurrencyRates {
	static readonly type = '[CURR-RATES-GROUP] Fetch All currency groups';
}
