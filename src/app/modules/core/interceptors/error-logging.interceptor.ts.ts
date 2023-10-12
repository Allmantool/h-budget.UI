/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import {
	HttpEvent,
	HttpHandler,
	HttpInterceptor,
	HttpRequest,
} from '@angular/common/http';

@Injectable()
export class ErrorLoggingInterceptor implements HttpInterceptor {
	intercept(
		request: HttpRequest<any>,
		next: HttpHandler
	): Observable<HttpEvent<any>> {
		return next.handle(request).pipe(this.handleError);
	}

	handleError(handleError: any): Observable<HttpEvent<any>> {
		let errorMessage = 'Unknown error!';

		errorMessage =
			handleError.error instanceof ErrorEvent
				? `Error: ${handleError.error.message}`
				: `Error Code: ${handleError.status}\nMessage: ${handleError.message}`;

		window.alert(errorMessage);

		return throwError(errorMessage);
	}
}
