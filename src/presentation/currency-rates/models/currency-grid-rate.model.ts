import { CurrencyFlagDetails } from '../../../app/modules/shared/models/currency-flag-details';
import { CurrencyTrend } from '../../../app/modules/shared/store/models/currency-rates/currency-trend';

export class CurrencyGridRateModel {
	constructor(rate: Partial<CurrencyGridRateModel>) {
		this.currencyId = rate.currencyId;
		this.abbreviation = rate.abbreviation;
		this.scale = rate.scale;
		this.name = rate.name;
		this.officialRate = rate.officialRate;
		this.updateDate = rate.updateDate;
		this.rateDiff = rate.rateDiff;
		this.ratePerUnit = rate.ratePerUnit;
		this.currencyTrend = rate.currencyTrend ?? CurrencyTrend.notChanged;
		this.country = rate.country;
	}

	currencyId?: number;
	abbreviation?: string;
	scale?: number;
	name?: string;
	officialRate?: number;
	updateDate?: Date;
	ratePerUnit?: number;
	currencyTrend?: string;
	rateDiff?: string;
	country?: CurrencyFlagDetails;
}
