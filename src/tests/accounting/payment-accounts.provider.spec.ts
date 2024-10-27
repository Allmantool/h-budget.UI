/* eslint-disable @typescript-eslint/unbound-method */
import { HttpClient } from '@angular/common/http';
import { getTestBed, TestBed } from '@angular/core/testing';

import { Mapper, MapperModule } from '@dynamic-mapper/angular';
import { NgxsModule } from '@ngxs/store';
import { of } from 'rxjs';

import { AppConfigurationService } from '../../app/modules/shared/services/app-configuration.service';
import { ngxsConfig } from '../../app/modules/shared/store/ngxs.config';
import { AccountingOperationsTableState } from '../../app/modules/shared/store/states/accounting/accounting-operations-table.state';
import { AccountingOperationsState } from '../../app/modules/shared/store/states/accounting/payment-operations.state';
import { PaymentAccountsMappingProfile } from '../../data/providers/accounting/mappers/payment-accounts.mapping.profile';
import { DefaultPaymentAccountsProvider } from '../../data/providers/accounting/payment-accounts.provider';
import { IPaymentAccountModel } from '../../domain/models/accounting/payment-account.model';
import { IAppSettingsModel } from '../../domain/models/app-settings.model';

describe('payments accounts provider', () => {
	let sut: DefaultPaymentAccountsProvider;

	let mapper: Mapper;

	let appConfigurationServiceSpy: jasmine.SpyObj<AppConfigurationService>;
	let httpClientSpy: jasmine.SpyObj<HttpClient>;

	beforeEach(() => {
		appConfigurationServiceSpy = jasmine.createSpyObj<AppConfigurationService>('appConfigurationService', {
			settings: {
				gatewayHost: 'acc-host-test',
			} as IAppSettingsModel,
		});

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

		mapper = getTestBed().inject(Mapper);

		sut = TestBed.inject(DefaultPaymentAccountsProvider);
	});

	it('should execute http client delete', (done: DoneFn) => {
		sut.removePaymentAccount('test account guid');

		expect(httpClientSpy.delete).toHaveBeenCalled();
		done();
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
