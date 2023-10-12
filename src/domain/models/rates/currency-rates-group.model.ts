import * as _ from 'lodash';

import { CurrencyRateValueModel } from './currency-rate-value.model';

export class CurrencyRateGroupModel {
	constructor(currencyRates: Partial<CurrencyRateGroupModel>) {
		this.currencyId = currencyRates.currencyId;
		this.abbreviation = currencyRates.abbreviation;
		this.scale = currencyRates.scale;
		this.name = currencyRates.name;

		this.rateValues = currencyRates.rateValues?.map((rv) => {
			return <CurrencyRateValueModel>{
				updateDate: !_.isNil(rv.updateDate)
					? new Date(rv.updateDate)
					: rv.updateDate,
				ratePerUnit: rv.ratePerUnit,
			};
		});
	}
	currencyId?: number;
	name?: string;
	abbreviation?: string;
	scale?: number;
	rateValues?: CurrencyRateValueModel[];
}
