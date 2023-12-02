import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { getTestBed, TestBed } from '@angular/core/testing';

import { Mapper, MapperModule } from '@dynamic-mapper/angular';

import { RatesGroupEntity } from 'data/providers/rates/entities/rates-group.entity';

import { AppConfigurationService } from '../../../app/modules/shared/services/app-configuration.service';
import { Result } from '../../../core/result';
import { DataRatesMappingProfile } from '../../../data/providers/rates/mappers/data-rates-mapping.profiler';
import { NationalBankCurrenciesProvider } from '../../../data/providers/rates/national-bank-currencies.provider';
import { AppSettingsModel } from '../../../domain/models/app-settings.model';
import { DaysRangePayload } from '../../../domain/models/dates-range-payload.model';
import { CurrencyGridRateModel } from '../../../presentation/currency-rates/models/currency-grid-rate.model';

describe('National bank currencies provider', () => {
	const RATE_HOST: string = 'test-rates-host';

	let injector: TestBed;

	let sut: NationalBankCurrenciesProvider;
	let httpMock: HttpTestingController;

	beforeEach(() => {
		const appConfigurationService = new AppConfigurationService();

		const appSettings: AppSettingsModel = {
			ratesHost: RATE_HOST,
		};

		appConfigurationService.settings = appSettings;

		TestBed.configureTestingModule({
			imports: [HttpClientTestingModule, MapperModule.withProfiles([DataRatesMappingProfile])],
			providers: [
				Mapper,
				NationalBankCurrenciesProvider,
				{
					provide: AppConfigurationService,
					useValue: appConfigurationService,
				},
			],
		});

		injector = getTestBed();

		sut = injector.inject(NationalBankCurrenciesProvider);
		httpMock = injector.inject(HttpTestingController);
	});

	afterEach(() => {
		httpMock.verify();
	});

	it('should return expected abbreviaion for "getCurrenciesForSpecifiedPeriod" request', (done: DoneFn) => {
		const payloadRequest = new DaysRangePayload({
			startDate: new Date(2022, 10, 30),
			endDate: new Date(2023, 11, 2),
		});

		sut.getCurrenciesForSpecifiedPeriod(payloadRequest).subscribe(response => {
			expect(response[0].abbreviation).toBe('test');
			done();
		});

		const requestResponseMock: RatesGroupEntity[] = [
			{
				currencyId: 1,
				name: 'currency for test',
				abbreviation: 'test',
				scale: 1,
				rateValues: [
					{
						officialRate: 20,
						ratePerUnit: 1,
						updateDate: new Date(2023, 11, 2),
					},
				],
			},
		];

		httpMock.expectOne(`${RATE_HOST}/currency-rates/period/2022-11-30/2023-12-02`).flush(
			new Result({
				payload: requestResponseMock,
			})
		);
	});

	it('should return amount of saved record for "saveCurrencies" request', (done: DoneFn) => {
		const payloadRequest: CurrencyGridRateModel[] = [
			new CurrencyGridRateModel({
				currencyId: 1,
				abbreviation: 'test-1',
				updateDate: new Date(2023, 11, 2),
				scale: 1,
			}),
			new CurrencyGridRateModel({
				currencyId: 2,
				abbreviation: 'test-2',
				updateDate: new Date(2023, 11, 2),
				scale: 1,
			}),
			new CurrencyGridRateModel({
				currencyId: 3,
				abbreviation: 'test-3',
				updateDate: new Date(2023, 11, 2),
				scale: 1,
			}),
		];

		sut.saveCurrencies(payloadRequest).subscribe(response => {
			expect(response.payload).toBe(3);
			done();
		});

		const requestResponseMock: Result<number> = new Result({
			payload: payloadRequest.length,
		});

		httpMock.expectOne(`${RATE_HOST}/currency-rates`).flush(requestResponseMock);
	});
});
