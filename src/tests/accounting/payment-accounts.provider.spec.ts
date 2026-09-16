/* eslint-disable @typescript-eslint/unbound-method */
import { HttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';

import { MapperModule } from '@dynamic-mapper/angular';
import { NgxsModule } from '@ngxs/store';
import { of } from 'rxjs';

import { AppConfigurationService } from '../../app/modules/shared/services/app-configuration.service';
import { ngxsConfig } from '../../app/modules/shared/store/ngxs.config';
import { AccountingOperationsTableState } from '../../app/modules/shared/store/states/accounting/accounting-operations-table.state';
import { AccountingOperationsState } from '../../app/modules/shared/store/states/accounting/payment-operations.state';
import { Result } from '../../core/result';
import { PaymentAccountsMappingProfile } from '../../data/providers/accounting/mappers/payment-accounts.mapping.profile';
import { DefaultPaymentAccountsProvider } from '../../data/providers/accounting/payment-accounts.provider';
import { IPaymentAccountModel } from '../../domain/models/accounting/payment-account.model';

describe('payments accounts provider', () => {
	let sut: DefaultPaymentAccountsProvider;

	let appConfigurationServiceSpy: jasmine.SpyObj<AppConfigurationService>;
	let httpClientSpy: jasmine.SpyObj<HttpClient>;

	beforeEach(() => {
		appConfigurationServiceSpy = {
			settings: {
				gatewayHost: 'acc-host-test',
			},
		};

		httpClientSpy = jasmine.createSpyObj<HttpClient>('httpClient', {
			get: of(''),
			post: of(''),
			patch: of(''),
			delete: of(''),
		});

		TestBed.configureTestingModule({
			imports: [
				MapperModule.withProfiles([PaymentAccountsMappingProfile]),
				NgxsModule.forRoot([AccountingOperationsState, AccountingOperationsTableState], ngxsConfig),
			],
			providers: [
				DefaultPaymentAccountsProvider,
				{
					provide: AppConfigurationService,
					useValue: appConfigurationServiceSpy,
				},
				{
					provide: HttpClient,
					useValue: httpClientSpy,
				},
			],
		});

		sut = TestBed.inject(DefaultPaymentAccountsProvider);
	});

	it('should execute the gateway DELETE contract and return the deleted account ID', done => {
		const accountId = '0879167a-a6e8-4518-9850-4dd87a4e5be6';
		httpClientSpy.delete.and.returnValue(of(new Result<string>({ isSucceeded: true, payload: accountId })));

		sut.removePaymentAccount(accountId).subscribe(result => {
			expect(httpClientSpy.delete).toHaveBeenCalledOnceWith(
				`acc-host-test/accounting/payment-accounts/${accountId}`
			);
			expect(result.payload).toBe(accountId);
			done();
		});
	});

	it('should execute http client save', (done: DoneFn) => {
		sut.savePaymentAccount({} as IPaymentAccountModel);

		expect(httpClientSpy.post).toHaveBeenCalled();
		done();
	});

	it('should execute http client patch', (done: DoneFn) => {
		sut.updatePaymentAccount({} as IPaymentAccountModel, 'account id');

		expect(httpClientSpy.patch).toHaveBeenCalled();
		done();
	});

	it('should execute http client get', (done: DoneFn) => {
		sut.getById('test account guid');

		expect(httpClientSpy.get).toHaveBeenCalled();
		done();
	});

	it('should execute http client get', (done: DoneFn) => {
		sut.getPaymentAccounts();

		expect(httpClientSpy.get).toHaveBeenCalled();
		done();
	});
});
