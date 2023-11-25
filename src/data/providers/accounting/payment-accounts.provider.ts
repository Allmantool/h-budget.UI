import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { Mapper } from '@dynamic-mapper/angular';
import { filter, map, Observable, retry, take, tap } from 'rxjs';

import { PaymentAccountEntity } from './entities/payment-account.entity';
import { PaymentAccountsMappingProfile } from './mappers/payment-accounts.mapping.profile';
import { AppConfigurationService } from '../../../app/modules/shared/services/app-configuration.service';
import { Result } from '../../../core/result';
import { PaymentAccountModel } from '../../../domain/models/accounting/payment-account.model';
import { PaymentAccountsProvider } from '../../../domain/providers/accounting/payment-accounts.provider';

@Injectable()
export class DefaultPaymentAccountsProvider implements PaymentAccountsProvider {
	private paymentAccountApi: string = 'payment-accounts';
	private accountingHostUrl?: string;

	constructor(
		private readonly http: HttpClient,
		private readonly mapper: Mapper,
		private readonly appConfigurationService: AppConfigurationService
	) {
		this.accountingHostUrl = this.appConfigurationService.settings?.accountingHost;
	}

	public removePaymentAccount(accountGuid: string): Observable<Result<boolean>> {
		return this.http
			.delete<Result<boolean>>(`${this.accountingHostUrl}/${this.paymentAccountApi}/${accountGuid}`)
			.pipe(
				filter(responseResult => responseResult.isSucceeded),
				tap(() => console.log(`The account with guid '${accountGuid}' has been deleted`)),
				retry(3),
				take(1)
			);
	}

	public savePaymentAccount(newPaymentAccount: PaymentAccountModel): Observable<Result<string>> {
		const request = this.mapper?.map(
			PaymentAccountsMappingProfile.DomainToPaymentAccountCreateRequest,
			newPaymentAccount
		);

		return this.http
			.post<Result<string>>(`${this.accountingHostUrl}/${this.paymentAccountApi}`, request)
			.pipe(retry(3), take(1));
	}

	public updatePaymentAccount(
		updatedPaymentAccount: PaymentAccountModel,
		accountGuid: string
	): Observable<Result<string>> {
		const request = this.mapper?.map(
			PaymentAccountsMappingProfile.DomainToPaymentAccountCreateRequest,
			updatedPaymentAccount
		);

		return this.http
			.patch<Result<string>>(`${this.accountingHostUrl}/${this.paymentAccountApi}/${accountGuid}`, request)
			.pipe(retry(3), take(1));
	}

	public getPaymentAccountById(paymentAccountId: string): Observable<PaymentAccountModel> {
		return this.http
			.get<Result<PaymentAccountEntity>>(
				`${this.accountingHostUrl}/${this.paymentAccountApi}/byId/${paymentAccountId}`
			)
			.pipe(
				map(
					responseResult =>
						this.mapper?.map(
							PaymentAccountsMappingProfile.PaymentAccountEntityToDomain,
							responseResult.payload
						)
				),
				retry(3),
				take(1)
			);
	}

	public getPaymentAccounts(): Observable<PaymentAccountModel[]> {
		return this.http
			.get<Result<PaymentAccountEntity[]>>(`${this.accountingHostUrl}/${this.paymentAccountApi}`)
			.pipe(
				map(
					responseResult =>
						this.mapper?.map(
							PaymentAccountsMappingProfile.PaymentAccountEntityToDomain,
							responseResult.payload
						)
				),
				retry(3),
				take(1)
			);
	}
}
