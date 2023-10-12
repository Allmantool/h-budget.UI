import { MappingPair, Profile } from '@dynamic-mapper/mapper';

import * as _ from 'lodash';

import { RatesGroupEntity } from '../entities/rates-group.entity';
import { CurrencyRateGroupModel } from 'domain/models/rates/currency-rates-group.model';
import { RateValueEntity } from '../entities/rate-value.entity';
import { CurrencyRateValueModel } from 'domain/models/rates/currency-rate-value.model';

export class DataRatesMappingProfile extends Profile {
	static readonly RatesGroupEntityToDomain = new MappingPair<
		RatesGroupEntity,
		CurrencyRateGroupModel
	>();
	static readonly RateValueEntityToDomain = new MappingPair<
		RateValueEntity,
		CurrencyRateValueModel
	>();

	constructor() {
		super();

		this.createAutoMap(DataRatesMappingProfile.RateValueEntityToDomain, {
			officialRate: (opt) => {
				opt.preCondition((src) => !_.isNil(src.officialRate));
				opt.mapFrom((src) => src.officialRate);
			},
			ratePerUnit: (opt) => {
				opt.preCondition((src) => !_.isNil(src.ratePerUnit));
				opt.mapFrom((src) => src.ratePerUnit);
			},
			updateDate: (opt) => {
				opt.preCondition((src) => !_.isNil(src.updateDate));
				opt.mapFrom((src) => new Date(src.updateDate));
			},
		});

		this.createAutoMap(DataRatesMappingProfile.RatesGroupEntityToDomain, {
			currencyId: (opt) => {
				opt.preCondition((src) => !_.isNil(src.currencyId));
				opt.mapFrom((src) => src.currencyId);
			},
			name: (opt) => {
				opt.preCondition((src) => !_.isNil(src.name));
				opt.mapFrom((src) => src.name);
			},
			scale: (opt) => {
				opt.preCondition((src) => !_.isNil(src.scale));
				opt.mapFrom((src) => src.scale);
			},
			abbreviation: (opt) => {
				opt.preCondition((src) => !_.isNil(src.abbreviation));
				opt.mapFrom((src) => src.abbreviation);
			},
			rateValues: (opt) =>
				opt.mapFromUsing(
					(src) => src.rateValues,
					DataRatesMappingProfile.RateValueEntityToDomain
				),
		});
	}
}
