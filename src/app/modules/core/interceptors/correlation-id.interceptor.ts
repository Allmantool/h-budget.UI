/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';

import _ from 'lodash';

import { Observable } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';

import { ApiHeaders } from '../../shared/constants/api-headers';

@Injectable()
export class CorrelationIdInteceptor implements HttpInterceptor {
	intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
		if (_.endsWith(req.url, 'config.json')) {
			return next.handle(req);
		}

		const headersWithCorrelationId = req.headers.set(ApiHeaders.CORRELATION_ID, uuidv4());

		const requestWithCarrelationId = req.clone({
			headers: headersWithCorrelationId,
		});

		return next.handle(requestWithCarrelationId);
	}
}
