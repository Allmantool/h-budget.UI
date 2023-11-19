import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Mapper } from '@dynamic-mapper/angular';
import { Observable, map, retry, take } from 'rxjs';

import { AppConfigurationService } from '../../../app/modules/shared/services/app-configuration.service';
import { Result } from '../../../core/result';
import { PaymentOperationModel } from '../../../domain/models/accounting/payment-operation.model';
import { PaymentOperationEntity } from './entities/payment-operation.entity';
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

	public getOperationsForPaymentAccount(): Observable<PaymentOperationModel[]> {
		return this.http
			.get<Result<PaymentOperationEntity[]>>(`${this.accountingHostUrl}/${this.paymentOperationsApi}`)
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
