import { HTTP_INTERCEPTORS, HttpClient, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ErrorHandler, importProvidersFrom } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { NgxsModule, Store } from '@ngxs/store';
import { Guid } from 'typescript-guid';

import { createStandaloneRootTestProviders } from './support/standalone-root-provider-test-config';
import { CorrelationIdInterceptor } from '../../app/modules/core/interceptors/correlation-id.interceptor';
import { HttpRequestLoaderInterceptor } from '../../app/modules/core/interceptors/http-request-loader.interceptor';
import { ApiHeaders } from '../../app/modules/shared/constants/api-headers';
import { ngxsConfig } from '../../app/modules/shared/store/ngxs.config';
import { CoreAppState } from '../../app/modules/shared/store/states/core/core-app.state';
import { requestsUnderProcessing } from '../../app/modules/shared/store/states/core/selectors/core-app.selectors';

describe('root provider HTTP parity', () => {
	let httpClient: HttpClient;
	let httpTestingController: HttpTestingController;
	let store: Store;

	afterEach(() => {
		httpTestingController?.verify({ ignoreCancelled: true });
	});

	describe('standalone scaffold with DI interceptors enabled', () => {
		beforeEach(() => {
			TestBed.resetTestingModule();
			TestBed.configureTestingModule({
				providers: [
					...createStandaloneRootTestProviders({
						production: true,
						includeAnimations: false,
						loadSettings: () => Promise.resolve(undefined),
						createErrorHandler: () => new ErrorHandler(),
					}),
					provideHttpClientTesting(),
				],
			});

			httpClient = TestBed.inject(HttpClient);
			httpTestingController = TestBed.inject(HttpTestingController);
			store = TestBed.inject(Store);
		});

		it('registers the class-based interceptors in the current root order', () => {
			const interceptors = TestBed.inject(HTTP_INTERCEPTORS);

			expect(interceptors[0]).toEqual(jasmine.any(CorrelationIdInterceptor));
			expect(interceptors[1]).toEqual(jasmine.any(HttpRequestLoaderInterceptor));
		});

		it('adds correlation id before loader tracking and resets after success', () => {
			httpClient.get('/api/payments').subscribe();

			const request = httpTestingController.expectOne('/api/payments');
			const correlationId = expectCorrelatedRequest(request.request.headers.get(ApiHeaders.CORRELATION_ID));

			expect(processingRequests()).toEqual([correlationId]);

			request.flush({});

			expect(processingRequests()).toEqual([]);
		});

		it('resets loader state after an HTTP error', () => {
			httpClient.get('/api/payments').subscribe({
				error: () => undefined,
			});

			const request = httpTestingController.expectOne('/api/payments');
			const correlationId = expectCorrelatedRequest(request.request.headers.get(ApiHeaders.CORRELATION_ID));

			expect(processingRequests()).toEqual([correlationId]);

			request.flush('failed', { status: 500, statusText: 'Server Error' });

			expect(processingRequests()).toEqual([]);
		});

		it('resets loader state after request cancellation', () => {
			const subscription = httpClient.get('/api/payments').subscribe();
			const request = httpTestingController.expectOne('/api/payments');
			const correlationId = expectCorrelatedRequest(request.request.headers.get(ApiHeaders.CORRELATION_ID));

			expect(processingRequests()).toEqual([correlationId]);

			subscription.unsubscribe();

			expect(request.cancelled).toBeTrue();
			expect(processingRequests()).toEqual([]);
		});

		it('keeps loader active until all overlapping requests complete', () => {
			httpClient.get('/api/payments/a').subscribe();
			httpClient.get('/api/payments/b').subscribe();

			const requestA = httpTestingController.expectOne('/api/payments/a');
			const requestB = httpTestingController.expectOne('/api/payments/b');
			const correlationIdA = expectCorrelatedRequest(requestA.request.headers.get(ApiHeaders.CORRELATION_ID));
			const correlationIdB = expectCorrelatedRequest(requestB.request.headers.get(ApiHeaders.CORRELATION_ID));

			expect(processingRequests()).toEqual([correlationIdA, correlationIdB]);

			requestA.flush({});

			expect(processingRequests()).toEqual([correlationIdB]);

			requestB.flush({});

			expect(processingRequests()).toEqual([]);
		});

		it('keeps loader active when one overlapping request fails', () => {
			httpClient.get('/api/payments/a').subscribe({
				error: () => undefined,
			});
			httpClient.get('/api/payments/b').subscribe();

			const requestA = httpTestingController.expectOne('/api/payments/a');
			const requestB = httpTestingController.expectOne('/api/payments/b');
			const correlationIdA = expectCorrelatedRequest(requestA.request.headers.get(ApiHeaders.CORRELATION_ID));
			const correlationIdB = expectCorrelatedRequest(requestB.request.headers.get(ApiHeaders.CORRELATION_ID));

			expect(processingRequests()).toEqual([correlationIdA, correlationIdB]);

			requestA.flush('failed', { status: 500, statusText: 'Server Error' });

			expect(processingRequests()).toEqual([correlationIdB]);

			requestB.flush({});

			expect(processingRequests()).toEqual([]);
		});

		it('keeps loader active when one overlapping request is cancelled', () => {
			const subscriptionA = httpClient.get('/api/payments/a').subscribe();
			httpClient.get('/api/payments/b').subscribe();

			const requestA = httpTestingController.expectOne('/api/payments/a');
			const requestB = httpTestingController.expectOne('/api/payments/b');
			const correlationIdA = expectCorrelatedRequest(requestA.request.headers.get(ApiHeaders.CORRELATION_ID));
			const correlationIdB = expectCorrelatedRequest(requestB.request.headers.get(ApiHeaders.CORRELATION_ID));

			expect(processingRequests()).toEqual([correlationIdA, correlationIdB]);

			subscriptionA.unsubscribe();

			expect(processingRequests()).toEqual([correlationIdB]);

			requestB.flush({});

			expect(processingRequests()).toEqual([]);
		});
	});

	it('would drop the DI class interceptors if withInterceptorsFromDi() is omitted', () => {
		TestBed.resetTestingModule();
		TestBed.configureTestingModule({
			providers: [
				importProvidersFrom(NgxsModule.forRoot([CoreAppState], ngxsConfig)),
				provideHttpClient(),
				{
					provide: HTTP_INTERCEPTORS,
					useClass: CorrelationIdInterceptor,
					multi: true,
				},
				{
					provide: HTTP_INTERCEPTORS,
					useClass: HttpRequestLoaderInterceptor,
					multi: true,
				},
				provideHttpClientTesting(),
			],
		});

		httpClient = TestBed.inject(HttpClient);
		httpTestingController = TestBed.inject(HttpTestingController);
		store = TestBed.inject(Store);

		httpClient.get('/api/payments').subscribe();

		const request = httpTestingController.expectOne('/api/payments');

		expect(request.request.headers.has(ApiHeaders.CORRELATION_ID)).toBeFalse();
		expect(processingRequests()).toEqual([]);

		request.flush({});
	});

	function processingRequests(): string[] {
		return store.selectSnapshot(requestsUnderProcessing);
	}
});

function expectCorrelatedRequest(correlationId: string | null): string {
	expect(correlationId).toBeTruthy();
	expect(Guid.isGuid(correlationId as string)).toBeTrue();

	return correlationId as string;
}
