import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { Mapper } from '@dynamic-mapper/angular';
import { Observable, retry, take } from 'rxjs';

import { PaymentOperationsMappingProfile } from './mappers/payment-operations.mapping.profile';
import { ApiRequestOptions } from '../../../app/modules/shared/constants/api-request-options';
import { AppConfigurationService } from '../../../app/modules/shared/services/app-configuration.service';
import { Result } from '../../../core/result';
import { IPaymentOperationModel } from '../../../domain/models/accounting/payment-operation.model';
import { IPaymentAccountCreateOrUpdateResponse } from '../../../domain/models/accounting/responses/payment-account-create-or-update.response';

@Injectable()
export class PaymentOperationsProvider {
	private paymentOperationsApi: string = 'accounting/payment-operations';
	private accountingHostUrl?: string;

	constructor(
		private readonly http: HttpClient,
		private readonly mapper: Mapper,
		private readonly appConfigurationService: AppConfigurationService
	) {
		this.accountingHostUrl = this.appConfigurationService.settings?.gatewayHost;
	}

	public savePaymentOperation(
		paymentAccountId: string,
		operationsForSave: IPaymentOperationModel
	): Observable<Result<IPaymentAccountCreateOrUpdateResponse>> {
		const request = this.mapper.map(
			PaymentOperationsMappingProfile.DomainToPaymentOperationSaveRequest,
			operationsForSave
		);

		return this.http
			.post<
				Result<IPaymentAccountCreateOrUpdateResponse>
			>(`${this.accountingHostUrl}/${this.paymentOperationsApi}/${paymentAccountId}`, request)
			.pipe(retry(3), take(1));
	}

	public updatePaymentOperation(
		operationForUpdate: IPaymentOperationModel,
		paymentAccountId: string,
		paymentOperationId: string
	): Observable<Result<IPaymentAccountCreateOrUpdateResponse>> {
		const request = this.mapper.map(
			PaymentOperationsMappingProfile.DomainToPaymentOperationSaveRequest,
			operationForUpdate
		);

		return this.http
			.patch<
				Result<IPaymentAccountCreateOrUpdateResponse>
			>(`${this.accountingHostUrl}/${this.paymentOperationsApi}/${paymentAccountId}/${paymentOperationId}`, request)
			.pipe(retry(ApiRequestOptions.RETRY_AMOUNT), take(1));
	}

	public removePaymentOperation(
		paymentAccountId: string,
		paymentOperationId: string
	): Observable<Result<IPaymentAccountCreateOrUpdateResponse>> {
		return this.http
			.delete<
				Result<IPaymentAccountCreateOrUpdateResponse>
			>(`${this.accountingHostUrl}/${this.paymentOperationsApi}/${paymentAccountId}/${paymentOperationId}`)
			.pipe(retry(ApiRequestOptions.RETRY_AMOUNT), take(1));
	}
}
