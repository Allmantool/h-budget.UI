import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { Mapper } from '@dynamic-mapper/angular';
import { format } from 'date-fns';
import { Observable } from 'rxjs';
import { map, retry, take, tap } from 'rxjs/operators';

import { CurrencyGridRateModel } from 'presentation/currency-rates/models/currency-grid-rate.model';

import { RatesGroupEntity } from './entities/rates-group.entity';
import { DataRatesMappingProfile } from './mappers/data-rates-mapping.profiler';
import { AppConfigurationService } from '../../../app/modules/shared/services/app-configuration.service';
import { Result } from '../../../core/result';
import { DaysRangePayload } from '../../../domain/models/dates-range-payload.model';
import { CurrencyRateGroupModel } from '../../../domain/models/rates/currency-rates-group.model';
import { BankCurrencyProvider } from '../../../domain/providers/rates/bank-currency.provider';

@Injectable()
export class NationalBankCurrencyProvider implements BankCurrencyProvider {
	private hostUrl?: string;

	private apiUrl: string = 'currency-rates';

	constructor(
		private readonly http: HttpClient,
		private readonly mapper: Mapper,
		private readonly appConfigurationService: AppConfigurationService
	) {
		this.hostUrl = this.appConfigurationService.settings?.ratesHost;
	}

	public getCurrenciesForSpecifiedPeriod(payload: DaysRangePayload): Observable<CurrencyRateGroupModel[]> {
		const ratesUrl: string = `${this.hostUrl}/${this.apiUrl}/period`;

		// prettier-ignore
		const parametersSegmentUri = `${format(payload.startDate,'yyyy-MM-dd')}/${format(payload.endDate, 'yyyy-MM-dd')}`;

		return this.http.get<Result<RatesGroupEntity[]>>(`${ratesUrl}/${parametersSegmentUri}`).pipe(
			map(
				responseResult =>
					this.mapper?.map(DataRatesMappingProfile.RatesGroupEntityToDomain, responseResult.payload)
			),
			retry(3),
			take(1)
		);
	}

	public saveCurrencies(rates: CurrencyGridRateModel[]): Observable<Result<number>> {
		return this.http
			.post<Result<number>>(`${this.hostUrl}/${this.apiUrl}`, {
				currencyRates: rates,
			})
			.pipe(
				tap((result: Result<number>) => console.log(`Affected rows count: ${result.payload}`)),
				take(1)
			);
	}

	public getCurrencies(): Observable<CurrencyRateGroupModel[]> {
		return this.http.get<Result<RatesGroupEntity[]>>(`${this.hostUrl}/${this.apiUrl}`).pipe(
			map(
				responseResult =>
					this.mapper?.map(DataRatesMappingProfile.RatesGroupEntityToDomain, responseResult.payload)
			),
			retry(3),
			take(1)
		);
	}

	public getTodayCurrencies(): Observable<CurrencyRateGroupModel[]> {
		return this.http.get<Result<RatesGroupEntity[]>>(`${this.hostUrl}/${this.apiUrl}/today`).pipe(
			map(
				responseResult =>
					this.mapper?.map(DataRatesMappingProfile.RatesGroupEntityToDomain, responseResult.payload)
			),
			retry(3),
			take(1)
		);
	}
}
