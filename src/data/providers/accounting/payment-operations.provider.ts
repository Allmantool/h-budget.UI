import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Mapper } from '@dynamic-mapper/angular';
import { Observable, map, retry, take } from 'rxjs';

import { AppConfigurationService } from '../../../app/modules/shared/services/app-configuration.service';
import { Result } from '../../../core/result';

import { PaymentOperationEntity } from './entities/payment-operation.entity';
import { PaymentOperationModel } from '../../../domain/models/accounting/payment-operation.model';
import { PaymentOperationsMappingProfile } from './mappers/payment-operations.mapping.profile';

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
}
