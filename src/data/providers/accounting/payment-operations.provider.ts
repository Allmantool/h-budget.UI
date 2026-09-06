import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { Mapper } from '@dynamic-mapper/angular';
import { Observable, take } from 'rxjs';

import { PaymentOperationsMappingProfile } from './mappers/payment-operations.mapping.profile';
import { AppConfigurationService } from '../../../app/modules/shared/services/app-configuration.service';
import { Result } from '../../../core/result';
import { IPaymentOperationModel } from '../../../domain/models/accounting/payment-operation.model';
import { IPaymentAccountCreateOrUpdateResponse } from '../../../domain/models/accounting/responses/payment-account-create-or-update.response';
import { IPaymentCommandResponse } from '../../../domain/models/accounting/responses/payment-command.response';

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
		operationsForSave: IPaymentOperationModel,
		idempotencyKey: string
	): Observable<Result<IPaymentAccountCreateOrUpdateResponse>> {
		const request = this.mapper.map(
			PaymentOperationsMappingProfile.DomainToPaymentOperationSaveRequest,
			operationsForSave
		);

		return this.http
			.post<Result<IPaymentAccountCreateOrUpdateResponse>>(
				`${this.accountingHostUrl}/${this.paymentOperationsApi}/${paymentAccountId}`,
				request,
				{
					headers: this.idempotencyHeaders(idempotencyKey),
				}
			)
			.pipe(take(1));
	}

	public updatePaymentOperation(
		operationForUpdate: IPaymentOperationModel,
		paymentAccountId: string,
		paymentOperationId: string,
		idempotencyKey: string
	): Observable<Result<IPaymentAccountCreateOrUpdateResponse>> {
		const request = this.mapper.map(
			PaymentOperationsMappingProfile.DomainToPaymentOperationSaveRequest,
			operationForUpdate
		);

		return this.http
			.patch<Result<IPaymentAccountCreateOrUpdateResponse>>(
				`${this.accountingHostUrl}/${this.paymentOperationsApi}/${paymentAccountId}/${paymentOperationId}`,
				request,
				{
					headers: this.idempotencyHeaders(idempotencyKey),
				}
			)
			.pipe(take(1));
	}

	public removePaymentOperation(
		paymentAccountId: string,
		paymentOperationId: string,
		idempotencyKey: string
	): Observable<Result<IPaymentAccountCreateOrUpdateResponse>> {
		return this.http
			.delete<Result<IPaymentAccountCreateOrUpdateResponse>>(
				`${this.accountingHostUrl}/${this.paymentOperationsApi}/${paymentAccountId}/${paymentOperationId}`,
				{
					headers: this.idempotencyHeaders(idempotencyKey),
				}
			)
			.pipe(take(1));
	}

	public getCommandStatus(paymentAccountId: string, commandId: string): Observable<Result<IPaymentCommandResponse>> {
		return this.http
			.get<
				Result<IPaymentCommandResponse>
			>(`${this.accountingHostUrl}/${this.paymentOperationsApi}/${paymentAccountId}/commands/${commandId}`)
			.pipe(take(1));
	}

	private idempotencyHeaders(idempotencyKey: string): HttpHeaders {
		return new HttpHeaders({ 'Idempotency-Key': idempotencyKey });
	}
}
