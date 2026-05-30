/* eslint-disable @typescript-eslint/no-explicit-any */

import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { Store } from '@ngxs/store';
import { finalize, Observable } from 'rxjs';

import { ApiHeaders } from '../../shared/constants/api-headers';
import { AddProcessingRequest, RemoveProcessingRequest } from '../../shared/store/states/core/actions/core-app.actions';

@Injectable()
export class HttpRequestLoaderInterceptor implements HttpInterceptor {
	constructor(private readonly store: Store) {}

	intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
		const correlationId = req.headers.get(ApiHeaders.CORRELATION_ID);

		if (correlationId) {
			this.store.dispatch(new AddProcessingRequest(correlationId));
		}

		return next.handle(req).pipe(
			finalize(() => {
				if (correlationId) {
					this.store.dispatch(new RemoveProcessingRequest(correlationId));
				}
			})
		);
	}
}
