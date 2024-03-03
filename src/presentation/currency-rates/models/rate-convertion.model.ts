export class RateConverionModel {
	constructor(convertion: Partial<RateConverionModel>) {
		this.originCurrencyId = convertion.originCurrencyId;
		this.targetCurrencyId = convertion.targetCurrencyId;
		this.operationDate = convertion.operationDate;
		this.amount = convertion.amount;
	}

	originCurrencyId?: number;
	targetCurrencyId?: number;
	operationDate?: Date;
	amount?: number;
}
