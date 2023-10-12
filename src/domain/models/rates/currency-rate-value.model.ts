export class CurrencyRateValueModel {
	constructor(currencyRates: Partial<CurrencyRateValueModel>) {
		this.updateDate = currencyRates.updateDate;
		this.officialRate = currencyRates.officialRate;
		this.ratePerUnit = currencyRates.ratePerUnit;
	}

	ratePerUnit?: number;
	updateDate?: Date;
	officialRate?: number;
}
