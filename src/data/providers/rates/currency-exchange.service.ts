import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { Mapper } from '@dynamic-mapper/angular';
import { Observable, retry, take } from 'rxjs';

import { ExchangeRatesMappingProfile } from './mappers/exchange-rates-mapping.profile';
import { ApiRequestOptions } from '../../../app/modules/shared/constants/api-request-options';
import { AppConfigurationService } from '../../../app/modules/shared/services/app-configuration.service';
import { Result } from '../../../core/result';
import { RateConvertionModel } from '../../../presentation/currency-rates/models/rate-convertion.model';
import { RateExchangeMultiplierModel } from '../../../presentation/currency-rates/models/rate-multiplier.model';

@Injectable()
export class CurrencyExchangeService {
	private hostUrl?: string;

	private apiUrl: string = 'currency-exchange';

	constructor(
		private readonly http: HttpClient,
		private readonly mapper: Mapper,
		private readonly appConfigurationService: AppConfigurationService
	) {
		this.hostUrl = this.appConfigurationService.settings?.ratesHost;
	}

	public getExchange(convertion: RateConvertionModel): Observable<Result<number>> {
		const request = this.mapper?.map(ExchangeRatesMappingProfile.RateExchangeModelToRequest, convertion);

		return this.http
			.post<Result<number>>(`${this.hostUrl}/${this.apiUrl}`, request)
			.pipe(retry(ApiRequestOptions.RETRY_AMOUNT), take(1));
	}

	public getExchangeMultiplier(multiplierQuery: RateExchangeMultiplierModel): Observable<Result<number>> {
		const request = this.mapper?.map(
			ExchangeRatesMappingProfile.RateExchangeMultiplierModelToRequest,
			multiplierQuery
		);

		return this.http
			.post<Result<number>>(`${this.hostUrl}/${this.apiUrl}/multiplier`, request)
			.pipe(retry(ApiRequestOptions.RETRY_AMOUNT), take(1));
	}
}
