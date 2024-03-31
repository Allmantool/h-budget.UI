export class RateExchangeMultiplierModel {
	constructor(convertion: Partial<RateExchangeMultiplierModel>) {
		this.originCurrency = convertion.originCurrency;
		this.targetCurrency = convertion.targetCurrency;
		this.operationDate = convertion.operationDate;
	}

	originCurrency?: string;
	targetCurrency?: string;
	operationDate?: Date;
}
