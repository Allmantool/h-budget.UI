import { Injectable, signal } from '@angular/core';

import { Observable, finalize } from 'rxjs';

@Injectable({
	providedIn: 'root',
})
export class LoaderService {
	isLoading = signal(false);

	// Overload signatures
	withLoader<T>(action: () => Promise<T>): Promise<T>;
	withLoader<T>(action: Observable<T>): Observable<T>;

	withLoader<T>(action: (() => Promise<T>) | Observable<T>): Observable<T> | Promise<T> {
		this.isLoading.set(true);

		if (typeof action === 'function') {
			return (async () => {
				try {
					return await action();
				} finally {
					this.isLoading.set(false);
				}
			})();
		} else {
			return action.pipe(
				finalize(() => {
					this.isLoading.set(false);
				})
			);
		}
	}
}
