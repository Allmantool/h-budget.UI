import { MappingPair, Profile } from '@dynamic-mapper/mapper';

import * as _ from 'lodash';

import { CurrencyRateGroupModel } from 'domain/models/rates/currency-rates-group.model';
import { CurrencyGridRateModel } from '../models/currency-grid-rate.model';
import { CurrencyTrend } from 'app/modules/shared/store/models/currency-rates/currency-trend';

export class PresentationRatesMappingProfile extends Profile {
	static readonly CurrencyRateGroupModelToGridRates = new MappingPair<
		CurrencyRateGroupModel,
		CurrencyGridRateModel
	>();

	constructor() {
		super();

		this.createMap(
			PresentationRatesMappingProfile.CurrencyRateGroupModelToGridRates,
			{
				currencyId: (opt) => {
					opt.preCondition((src) => !_.isNil(src.currencyId));
					opt.mapFrom((src) => src.currencyId);
				},
				abbreviation: (opt) => {
					opt.preCondition((src) => !_.isNil(src.abbreviation));
					opt.mapFrom((src) => src.abbreviation);
				},
				scale: (opt) => {
					opt.preCondition((src) => !_.isNil(src.scale));
					opt.mapFrom((src) => src.scale);
				},
				name: (opt) => {
					opt.preCondition((src) => !_.isNil(src.name));
					opt.mapFrom((src) => src.name);
				},
				officialRate: (opt) => {
					opt.preCondition((src) => !_.isNil(src.rateValues));
					opt.mapFrom((src) => _.first(src.rateValues)?.officialRate);
				},
				updateDate: (opt) => {
					opt.preCondition((src) => !_.isNil(src.rateValues));
					opt.mapFrom((src) => _.first(src.rateValues)?.updateDate);
				},
				ratePerUnit: (opt) => {
					opt.preCondition((src) => !_.isNil(src.rateValues));
					opt.mapFrom((src) => _.first(src.rateValues)?.ratePerUnit);
				},
				currencyTrend: (opt) => {
					opt.mapFrom(() => CurrencyTrend.notChanged);
				},
				rateDiff: (opt) => {
					opt.mapFrom(() => '0');
				},
			}
		);
	}
}
