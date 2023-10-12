export class NationalBankCurrencyRate {
	constructor(currencyRates: Partial<NationalBankCurrencyRate>) {
		this.updateDate = currencyRates.updateDate;
		this.abbreviation = currencyRates.abbreviation;
		this.scale = currencyRates.scale;
		this.name = currencyRates.name;
		this.officialRate = currencyRates.officialRate;
		this.currencyTrend = currencyRates.currencyTrend;
	}

	currencyId?: number;
	updateDate?: Date;
	ratePerUnit?: number;
	abbreviation?: string;
	scale?: number;
	name?: string;
	officialRate?: number;
	currencyTrend?: string;
	rateDiff?: string;
}
