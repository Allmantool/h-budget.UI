import { HttpEvent, HttpHandler, HttpHeaders, HttpRequest, HttpResponse } from '@angular/common/http';

import { Store } from '@ngxs/store';
import { Observable, of, throwError } from 'rxjs';
import { Guid } from 'typescript-guid';

import { CorrelationIdInterceptor } from '../../app/modules/core/interceptors/correlation-id.interceptor';
import { HttpRequestLoaderInterceptor } from '../../app/modules/core/interceptors/http-request-loader.interceptor';
import { ApiHeaders } from '../../app/modules/shared/constants/api-headers';
import {
	AddProcessingRequest,
	RemoveProcessingRequest,
} from '../../app/modules/shared/store/states/core/actions/core-app.actions';

class StubHttpHandler implements HttpHandler {
	public handledRequest: HttpRequest<unknown> | undefined;

	constructor(private readonly response$: Observable<HttpEvent<unknown>>) {}

	public handle(request: HttpRequest<unknown>): Observable<HttpEvent<unknown>> {
		this.handledRequest = request;

		return this.response$;
	}
}

describe('HTTP interceptors', () => {
	describe('CorrelationIdInterceptor', () => {
		it('adds a correlation id to API requests', () => {
			const handler = new StubHttpHandler(of(new HttpResponse({ status: 200 })));
			const request = new HttpRequest('GET', '/api/payments');

			new CorrelationIdInterceptor().intercept(request, handler).subscribe();

			const correlationId = handler.handledRequest?.headers.get(ApiHeaders.CORRELATION_ID);

			expect(correlationId).toBeTruthy();
			expect(Guid.isGuid(correlationId as string)).toBe(true);
		});

		it('does not add a correlation id when loading runtime config', () => {
			const handler = new StubHttpHandler(of(new HttpResponse({ status: 200 })));
			const request = new HttpRequest('GET', 'assets/config.json');

			new CorrelationIdInterceptor().intercept(request, handler).subscribe();

			expect(handler.handledRequest?.headers.has(ApiHeaders.CORRELATION_ID)).toBe(false);
		});
	});

	describe('HttpRequestLoaderInterceptor', () => {
		let store: jasmine.SpyObj<Store>;

		beforeEach(() => {
			store = jasmine.createSpyObj<Store>('Store', ['dispatch']);
		});

		it('tracks and clears a correlated request after success', () => {
			const correlationId = 'request-1';
			const handler = new StubHttpHandler(of(new HttpResponse({ status: 200 })));
			const request = requestWithCorrelationId(correlationId);

			new HttpRequestLoaderInterceptor(store).intercept(request, handler).subscribe();

			expect(store.dispatch.calls.count()).toBe(2);
			expect(store.dispatch.calls.argsFor(0)[0]).toEqual(new AddProcessingRequest(correlationId));
			expect(store.dispatch.calls.argsFor(1)[0]).toEqual(new RemoveProcessingRequest(correlationId));
		});

		it('clears a correlated request after an HTTP error', () => {
			const correlationId = 'request-2';
			const handler = new StubHttpHandler(throwError(() => new Error('Request failed')));
			const request = requestWithCorrelationId(correlationId);

			new HttpRequestLoaderInterceptor(store).intercept(request, handler).subscribe({
				error: () => undefined,
			});

			expect(store.dispatch.calls.count()).toBe(2);
			expect(store.dispatch.calls.argsFor(0)[0]).toEqual(new AddProcessingRequest(correlationId));
			expect(store.dispatch.calls.argsFor(1)[0]).toEqual(new RemoveProcessingRequest(correlationId));
		});

		it('does not track requests without a correlation id', () => {
			const handler = new StubHttpHandler(of(new HttpResponse({ status: 200 })));
			const request = new HttpRequest('GET', '/api/payments');

			new HttpRequestLoaderInterceptor(store).intercept(request, handler).subscribe();

			expect(store.dispatch.calls.count()).toBe(0);
		});
	});
});

function requestWithCorrelationId(correlationId: string): HttpRequest<unknown> {
	return new HttpRequest('GET', '/api/payments', {
		headers: new HttpHeaders({
			[ApiHeaders.CORRELATION_ID]: correlationId,
		}),
	});
}
