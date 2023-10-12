/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
	HttpEvent,
	HttpHandler,
	HttpInterceptor,
	HttpRequest,
} from '@angular/common/http';
import { Injectable } from '@angular/core';

import { v4 as uuidv4 } from 'uuid';
import { Observable } from 'rxjs';

import { ApiHeaders } from '../../shared/constants/api-headers';

@Injectable()
export class CorrelationIdInteceptor implements HttpInterceptor {
	intercept(
		req: HttpRequest<any>,
		next: HttpHandler
	): Observable<HttpEvent<any>> {
		const requestWithCarrelationId = req.clone({
			headers: req.headers.set(ApiHeaders.CORRELATION_ID, uuidv4()),
		});

		return next.handle(requestWithCarrelationId);
	}
}
