export class CurrencyRateValueModel {
	constructor(currencyRate: Partial<CurrencyRateValueModel>) {
		this.officialRate = currencyRate.officialRate;
		this.updateDate = currencyRate.updateDate;
		this.ratePerUnit = currencyRate.ratePerUnit;
	}

	ratePerUnit?: number;
	updateDate?: Date;
	officialRate?: number;
}
