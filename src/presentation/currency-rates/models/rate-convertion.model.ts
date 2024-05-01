export class RateConvertionModel {
	constructor(convertion: Partial<RateConvertionModel>) {
		this.originCurrency = convertion.originCurrency;
		this.targetCurrency = convertion.targetCurrency;
		this.operationDate = convertion.operationDate;
		this.amount = convertion.amount;
	}

	originCurrency?: string;
	targetCurrency?: string;
	operationDate?: Date;
	amount?: number;
}
