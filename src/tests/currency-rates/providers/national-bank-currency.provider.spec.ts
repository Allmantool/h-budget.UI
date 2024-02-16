import { HTTP_INTERCEPTORS, HttpClient, HttpErrorResponse } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { getTestBed, TestBed } from '@angular/core/testing';

import { Mapper, MapperModule } from '@dynamic-mapper/angular';
import { take } from 'rxjs';
import { Guid } from 'typescript-guid';

import { IRatesGroupEntity } from 'data/providers/rates/entities/rates-group.entity';

import { CorrelationIdInteceptor } from '../../../app/modules/core/interceptors/correlation-id.interceptor';
import { AppConfigurationService } from '../../../app/modules/shared/services/app-configuration.service';
import { Result } from '../../../core/result';
import { DataRatesMappingProfile } from '../../../data/providers/rates/mappers/data-rates-mapping.profiler';
import { NationalBankCurrenciesProvider } from '../../../data/providers/rates/national-bank-currencies.provider';
import { IAppSettingsModel } from '../../../domain/models/app-settings.model';
import { DaysRangePayload } from '../../../domain/models/dates-range-payload.model';
import { CurrencyGridRateModel } from '../../../presentation/currency-rates/models/currency-grid-rate.model';

describe('national bank currencies provider', () => {
	const RATE_HOST: string = 'test-rates-host';
	const RATE_API: string = 'currency-rates';

	let injector: TestBed;

	let sut: NationalBankCurrenciesProvider;
	let httpMock: HttpTestingController;
	let httpClient: HttpClient;

	beforeEach(() => {
		const appConfigurationService = new AppConfigurationService();

		const appSettings: IAppSettingsModel = {
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
				{
					provide: HTTP_INTERCEPTORS,
					useClass: CorrelationIdInteceptor,
					multi: true,
				},
			],
		});

		injector = getTestBed();

		sut = injector.inject(NationalBankCurrenciesProvider);
		httpClient = TestBed.inject(HttpClient);
		httpMock = injector.inject(HttpTestingController);
	});

	afterEach(() => {
		httpMock.verify();
	});

	it('should attach the interceptor', () => {
		expect(TestBed.inject(HTTP_INTERCEPTORS).some(i => i instanceof CorrelationIdInteceptor)).toBe(true);
	});

	it('should set correlation id header to request', () => {
		const url = `${RATE_HOST}/${RATE_API}/period/2022-11-30/2023-12-02`;

		httpClient.get(url).subscribe();

		const mockRequest = httpMock.expectOne(url);

		const correlationIdHeader = mockRequest.request.headers.get('CorrelationId');

		expect(correlationIdHeader).toBeTruthy();
		expect(Guid.isGuid(correlationIdHeader as string)).toBe(true);

		mockRequest.flush(null);
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

		const responseMock: IRatesGroupEntity[] = [
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

		httpMock.expectOne(`${RATE_HOST}/${RATE_API}/period/2022-11-30/2023-12-02`).flush(
			new Result({
				payload: responseMock,
			})
		);
	});

	it('should return expected amount of saved record for "saveCurrencies" request', (done: DoneFn) => {
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

		sut.saveCurrencies(payloadRequest)
			.pipe(take(1))
			.subscribe(response => {
				expect(response.payload).toBe(3);
				done();
			});

		const responseMock: Result<number> = new Result({
			payload: payloadRequest.length,
		});

		const request = httpMock.expectOne({ method: 'POST', url: `${RATE_HOST}/${RATE_API}` }, 'save request');

		expect(request.request.method).toBe('POST');

		request.flush(responseMock);
	});

	it('should succesfully return response for "getCurrencies" request', (done: DoneFn) => {
		sut.getCurrencies()
			.pipe(take(1))
			.subscribe(response => {
				expect(response.length).toBe(1);
				done();
			});

		const mockResponse: IRatesGroupEntity[] = [
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

		const request = httpMock.expectOne({ method: 'GET', url: `${RATE_HOST}/${RATE_API}` }, 'get request');

		expect(request.request.method).toBe('GET');

		request.flush(new Result({ payload: mockResponse }), { status: 200, statusText: 'ok' });
	});

	it('should succesfully return response for "getTodayCurrencies" request', (done: DoneFn) => {
		sut.getTodayCurrencies()
			.pipe(take(1))
			.subscribe(response => {
				expect(response.length).toBe(1);
				done();
			});

		const mockResponse: IRatesGroupEntity[] = [
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

		const request = httpMock.expectOne({ method: 'GET', url: `${RATE_HOST}/${RATE_API}/today` });

		expect(request.request.method).toBe('GET');

		request.flush(new Result({ payload: mockResponse }), { status: 200, statusText: 'ok' });
	});

	it('should retry "getTodayCurrencies" request expected amount of times.', (done: DoneFn) => {
		sut.getTodayCurrencies()
			.pipe(take(1))
			.subscribe({
				error: (error: HttpErrorResponse) => {
					expect(error.status).toBe(500);
					done();
				},
			});

		const expectedRetryAmount = 3;

		for (let i = 0, c = expectedRetryAmount + 1; i < c; i++) {
			const request = httpMock.expectOne({ method: 'GET', url: `${RATE_HOST}/${RATE_API}/today` });
			request.flush('The service temporary unavalable', { status: 500, statusText: 'Internal Server Error' });
		}
	});
});
