import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Mapper } from '@dynamic-mapper/angular';
import { Observable, map, retry, take, tap } from 'rxjs';

import { PaymentAccountsProvider } from '../../../domain/providers/accounting/payment-accounts.provider';
import { PaymentAccountModel } from '../../../domain/models/accounting/payment-account';
import { PaymentAccountEntity } from './entities/payment-account-entity';
import { Result } from '../../../core/result';
import { DataAccountingMappingProfile } from './mappers/data-accounting.mapping.profile';
import { RoutesSegments } from '../../../app/modules/shared/constants/routes-segments';

@Injectable()
export class DefaultPaymentAccountsProvider implements PaymentAccountsProvider {
	constructor(
		private readonly http: HttpClient,
		private readonly mapper: Mapper
	) {}

	public savePaymentAccount(newPaymentAccount: PaymentAccountModel): Observable<Result<string>> {

		const request = this.mapper?.map(
			DataAccountingMappingProfile.DomainToPaymentAccountCreateRequest,
			newPaymentAccount
		);

		return this.http
			.post<Result<string>>(
				`${RoutesSegments.HOME_BUDGET_ACCOUNTING_HOST}/paymentAccounts/makePaymentAccount`,
				{
					request,
				}
			)
			.pipe(
				tap((result: Result<string>) =>
					console.log(`New payment account guid: ${result.payload}`)
				),
				retry(3),
				take(1)
			);
	}

	public getPaymentAccounts(): Observable<PaymentAccountModel[]> {
		return this.http
			.get<Result<PaymentAccountEntity[]>>(
				`${RoutesSegments.HOME_BUDGET_ACCOUNTING_HOST}/paymentAccounts/GetPaymentAccounts`
			)
			.pipe(
				map(
					(responseResult) =>
						this.mapper?.map(
							DataAccountingMappingProfile.PaymentAccountEntityToDomain,
							responseResult.payload
						)
				),
				retry(3),
				take(1)
			);
	}
}
