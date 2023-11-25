import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { Mapper } from '@dynamic-mapper/angular';
import { map, Observable, retry, take } from 'rxjs';

import { PaymentOperationEntity } from './entities/payment-operation.entity';
import { PaymentOperationsMappingProfile } from './mappers/payment-operations.mapping.profile';
import { AppConfigurationService } from '../../../app/modules/shared/services/app-configuration.service';
import { Result } from '../../../core/result';
import { PaymentOperationModel } from '../../../domain/models/accounting/payment-operation.model';
import { PaymentAccountCreateOrUpdateResponse } from '../../../domain/models/accounting/responses/payment-account-create-or-update.response';

@Injectable()
export class PaymentOperationsProvider {
	private paymentOperationsApi: string = 'payment-operations';
	private accountingHostUrl?: string;

	constructor(
		private readonly http: HttpClient,
		private readonly mapper: Mapper,
		private readonly appConfigurationService: AppConfigurationService
	) {
		this.accountingHostUrl = this.appConfigurationService.settings?.accountingHost;
	}

	public getOperationsForPaymentAccount(paymentAccountId: string): Observable<PaymentOperationModel[]> {
		return this.http
			.get<Result<PaymentOperationEntity[]>>(
				`${this.accountingHostUrl}/${this.paymentOperationsApi}/${paymentAccountId}`
			)
			.pipe(
				map(
					responseResult =>
						this.mapper?.map(
							PaymentOperationsMappingProfile.PaymentOperaionEntityToDomain,
							responseResult.payload
						)
				),
				retry(3),
				take(1)
			);
	}

	public savePaymentOperation(
		paymentAccountId: string,
		operationsForSave: PaymentOperationModel
	): Observable<Result<PaymentAccountCreateOrUpdateResponse>> {
		const request = this.mapper.map(
			PaymentOperationsMappingProfile.DomainToPaymentOperationSaveRequest,
			operationsForSave
		);

		return this.http
			.post<Result<PaymentAccountCreateOrUpdateResponse>>(
				`${this.accountingHostUrl}/${this.paymentOperationsApi}/${paymentAccountId}`,
				request
			)
			.pipe(retry(3), take(1));
	}

	public updatePaymentOperation(
		operationForUpdate: PaymentOperationModel,
		paymentAccountId: string,
		paymentOperationId: string
	): Observable<Result<PaymentAccountCreateOrUpdateResponse>> {
		const request = this.mapper.map(
			PaymentOperationsMappingProfile.DomainToPaymentOperationSaveRequest,
			operationForUpdate
		);

		return this.http
			.patch<Result<PaymentAccountCreateOrUpdateResponse>>(
				`${this.accountingHostUrl}/${this.paymentOperationsApi}/${paymentAccountId}/${paymentOperationId}`,
				request
			)
			.pipe(retry(3), take(1));
	}

	public removePaymentOperation(
		paymentAccountId: string,
		paymentOperationId: string
	): Observable<Result<PaymentAccountCreateOrUpdateResponse>> {
		return this.http
			.delete<Result<PaymentAccountCreateOrUpdateResponse>>(
				`${this.accountingHostUrl}/${this.paymentOperationsApi}/${paymentAccountId}/${paymentOperationId}`
			)
			.pipe(retry(3), take(1));
	}
}
