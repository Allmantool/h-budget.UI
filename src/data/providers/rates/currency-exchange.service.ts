import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { Observable, retry, take } from 'rxjs';

import { ApiRequestOptions } from '../../../app/modules/shared/constants/api-request-options';
import { AppConfigurationService } from '../../../app/modules/shared/services/app-configuration.service';
import { Result } from '../../../core/result';
import { RateConverionModel } from '../../../presentation/currency-rates/models/rate-convertion.model';

@Injectable()
export class CurrencyExchangeService {
	private hostUrl?: string;

	private apiUrl: string = 'currency-exchange';

	constructor(
		private readonly http: HttpClient,
		private readonly appConfigurationService: AppConfigurationService
	) {
		this.hostUrl = this.appConfigurationService.settings?.ratesHost;
	}

	public getExchange(convertion: RateConverionModel): Observable<Result<number>> {
		return this.http
			.post<Result<number>>(`${this.hostUrl}/${this.apiUrl}`, {
				cvonvetion: convertion,
			})
			.pipe(retry(ApiRequestOptions.RETRY_AMOUNT), take(1));
	}
}
