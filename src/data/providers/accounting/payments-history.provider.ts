/* eslint-disable prettier/prettier */
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { Mapper } from '@dynamic-mapper/angular';
import { map, Observable, retry, take } from 'rxjs';

import { IPaymentHistoryEntity } from './entities/payment-history.entity';
import { PaymentHistoryMappingProfile } from './mappers/payment-history.mapping.profile';
import { AppConfigurationService } from '../../../app/modules/shared/services/app-configuration.service';
import { Result } from '../../../core/result';
import { IPaymentHistoryModel } from '../../../domain/models/accounting/payment-history.model';

@Injectable()
export class PaymensHistoryProvider {
	private paymentOperationsApi: string = 'payments-history';
	private accountingHostUrl?: string;

	constructor(
		private readonly http: HttpClient,
		private readonly mapper: Mapper,
		private readonly appConfigurationService: AppConfigurationService
	) {
		this.accountingHostUrl = this.appConfigurationService.settings?.accountingHost;
	}

	public getOperationsHistoryForPaymentAccount(paymentAccountId: string): Observable<IPaymentHistoryModel[]> {
		return this.http
			.get<Result<IPaymentHistoryEntity[]>>(
				`${this.accountingHostUrl}/${this.paymentOperationsApi}/${paymentAccountId}`
			)
			.pipe(
				map(resposneResult => resposneResult.payload),
				map(payload =>
					this.mapper.map(PaymentHistoryMappingProfile.PaymentOperaionHistoryEntityToDomain, payload)
				),
				retry(3),
				take(1)
			);
	}
}
