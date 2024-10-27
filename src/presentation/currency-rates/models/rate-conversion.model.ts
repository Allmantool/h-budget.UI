export class RateConversionModel {
	constructor(conversion: Partial<RateConversionModel>) {
		this.originCurrency = conversion.originCurrency;
		this.targetCurrency = conversion.targetCurrency;
		this.operationDate = conversion.operationDate;
		this.amount = conversion.amount;
	}

	originCurrency?: string;
	targetCurrency?: string;
	operationDate?: Date;
	amount?: number;
}
