import { HttpClient } from '@angular/common/http';
import { HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { Mapper } from '@dynamic-mapper/angular';
import { map, Observable, retry, take } from 'rxjs';
import { Guid } from 'typescript-guid';

import { IPaymentHistoryPageEntity } from './entities/payment-history-page.entity';
import { IPaymentHistoryEntity } from './entities/payment-history.entity';
import { PaymentHistoryMappingProfile } from './mappers/payment-history.mapping.profile';
import { ApiRequestOptions } from '../../../app/modules/shared/constants/api-request-options';
import { AppConfigurationService } from '../../../app/modules/shared/services/app-configuration.service';
import { Result } from '../../../core/result';
import { IPaymentHistoryPageModel } from '../../../domain/models/accounting/payment-history-page.model';
import { IPaymentHistoryQueryModel } from '../../../domain/models/accounting/payment-history-query.model';
import { IPaymentHistoryModel } from '../../../domain/models/accounting/payment-history.model';

@Injectable()
export class PaymentsHistoryProvider {
	private paymentOperationsApi: string = 'accounting/payments-history';
	private accountingHostUrl?: string;

	constructor(
		private readonly http: HttpClient,
		private readonly mapper: Mapper,
		private readonly appConfigurationService: AppConfigurationService
	) {
		this.accountingHostUrl = this.appConfigurationService.settings?.gatewayHost;
	}

	public getOperationsHistoryForPaymentAccount(paymentAccountId: string | Guid): Observable<IPaymentHistoryModel[]> {
		return this.http
			.get<
				Result<IPaymentHistoryEntity[]>
			>(`${this.accountingHostUrl}/${this.paymentOperationsApi}/${paymentAccountId.toString()}`)
			.pipe(
				map(responseResult => responseResult.payload),
				map(payload =>
					this.mapper.map(PaymentHistoryMappingProfile.PaymentOperationHistoryEntityToDomain, payload)
				),
				retry(ApiRequestOptions.RETRY_AMOUNT),
				take(1)
			);
	}

	public getPagedOperationsHistoryForPaymentAccount(
		paymentAccountId: string | Guid,
		query: IPaymentHistoryQueryModel
	): Observable<IPaymentHistoryPageModel> {
		return this.http
			.get<
				Result<IPaymentHistoryPageEntity>
			>(`${this.accountingHostUrl}/${this.paymentOperationsApi}/query/${paymentAccountId.toString()}`, { params: this.toQueryParams(query) })
			.pipe(
				map(responseResult => responseResult.payload),
				map(payload => ({
					...payload,
					items: this.mapper.map(
						PaymentHistoryMappingProfile.PaymentOperationHistoryEntityToDomain,
						payload.items
					),
				})),
				retry(ApiRequestOptions.RETRY_AMOUNT),
				take(1)
			);
	}

	private toQueryParams(query: IPaymentHistoryQueryModel): HttpParams {
		return (Object.keys(query) as Array<keyof IPaymentHistoryQueryModel>).reduce((params, key) => {
			const value = query[key];
			return value === undefined || value === '' ? params : params.set(key, String(value));
		}, new HttpParams());
	}

	public GetHistoryOperationById(
		paymentAccountId: string | Guid,
		paymentOperationId: string | Guid
	): Observable<IPaymentHistoryModel> {
		return this.http
			.get<
				Result<IPaymentHistoryEntity>
			>(`${this.accountingHostUrl}/${this.paymentOperationsApi}/${paymentAccountId.toString()}/byId/${paymentOperationId.toString()}`)
			.pipe(
				map(responseResult => responseResult.payload),
				map(payload =>
					this.mapper.map(PaymentHistoryMappingProfile.PaymentOperationHistoryEntityToDomain, payload)
				),
				retry(ApiRequestOptions.RETRY_AMOUNT),
				take(1)
			);
	}
}
