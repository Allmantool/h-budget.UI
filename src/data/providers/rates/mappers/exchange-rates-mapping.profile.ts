import * as _ from 'lodash';

import { MappingPair, Profile } from '@dynamic-mapper/mapper';
import { format } from 'date-fns';

import { DateFormats } from '../../../../app/modules/shared/constants/date-formats';
import { IRatesExchangeMultiplierRequest } from '../../../../domain/models/rates/requests/rates-exchange-multiplier.request';
import { IRatesExchangeRequest } from '../../../../domain/models/rates/requests/rates-exchange.request';
import { RateConvertionModel } from '../../../../presentation/currency-rates/models/rate-convertion.model';
import { RateExchangeMultiplierModel } from '../../../../presentation/currency-rates/models/rate-multiplier.model';

export class ExchangeRatesMappingProfile extends Profile {
	static readonly RateExchangeMultiplierModelToRequest = new MappingPair<
		RateExchangeMultiplierModel,
		IRatesExchangeMultiplierRequest
	>();

	static readonly RateExchangeModelToRequest = new MappingPair<RateConvertionModel, IRatesExchangeRequest>();

	constructor() {
		super();

		this.createAutoMap(ExchangeRatesMappingProfile.RateExchangeMultiplierModelToRequest, {
			operationDate: opt => {
				opt.preCondition(src => !_.isNil(src.operationDate));
				opt.mapFrom(src => format(src.operationDate!, DateFormats.ApiRequest));
			},
		});

		this.createAutoMap(ExchangeRatesMappingProfile.RateExchangeMultiplierModelToRequest, {
			operationDate: opt => {
				opt.preCondition(src => !_.isNil(src.operationDate));
				opt.mapFrom(src => format(src.operationDate!, DateFormats.ApiRequest));
			},
		});

		this.createAutoMap(ExchangeRatesMappingProfile.RateExchangeModelToRequest, {
			operationDate: opt => {
				opt.preCondition(src => !_.isNil(src.operationDate));
				opt.mapFrom(src => format(src.operationDate!, DateFormats.ApiRequest));
			},
		});
	}
}
