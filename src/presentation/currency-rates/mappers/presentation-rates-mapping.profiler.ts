import * as _ from 'lodash';

import { MappingPair, Profile } from '@dynamic-mapper/mapper';

import { CurrencyTrend } from '../../../app/modules/shared/store/models/currency-rates/currency-trend';
import { CurrencyRateValueModel } from '../../../domain/models/rates/currency-rate-value.model';
import { CurrencyRateGroupModel } from '../../../domain/models/rates/currency-rates-group.model';
import { CurrencyGridRateModel } from '../models/currency-grid-rate.model';

export class PresentationRatesMappingProfile extends Profile {
	static readonly CurrencyRateGroupModelToGridRates = new MappingPair<
		CurrencyRateGroupModel,
		CurrencyGridRateModel
	>();

	constructor() {
		super();

		this.createMap(PresentationRatesMappingProfile.CurrencyRateGroupModelToGridRates, {
			currencyId: opt => {
				opt.preCondition(src => !_.isNil(src.currencyId));
				opt.mapFrom(src => src.currencyId);
			},
			abbreviation: opt => {
				opt.preCondition(src => !_.isNil(src.abbreviation));
				opt.mapFrom(src => src.abbreviation);
			},
			scale: opt => {
				opt.preCondition(src => !_.isNil(src.scale));
				opt.mapFrom(src => src.scale);
			},
			name: opt => {
				opt.preCondition(src => !_.isNil(src.name));
				opt.mapFrom(src => src.name);
			},
			officialRate: opt => {
				opt.preCondition(src => !_.isNil(src.rateValues));
				opt.mapFrom(src => PresentationRatesMappingProfile.getLatestRateValue(src)?.officialRate);
			},
			updateDate: opt => {
				opt.preCondition(src => !_.isNil(src.rateValues));
				opt.mapFrom(src => PresentationRatesMappingProfile.getLatestRateValue(src)?.updateDate);
			},
			ratePerUnit: opt => {
				opt.preCondition(src => !_.isNil(src.rateValues));
				opt.mapFrom(src => PresentationRatesMappingProfile.getLatestRateValue(src)?.ratePerUnit);
			},
			currencyTrend: opt => {
				opt.mapFrom(() => CurrencyTrend.notChanged);
			},
			rateDiff: opt => {
				opt.mapFrom(() => '0');
			},
		});
	}

	private static getLatestRateValue(rateGroup: CurrencyRateGroupModel): CurrencyRateValueModel | undefined {
		return _.maxBy(rateGroup.rateValues, rateValue => rateValue.updateDate?.getTime() ?? 0);
	}
}
