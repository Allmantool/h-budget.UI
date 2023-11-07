import { DestroyRef, inject } from '@angular/core';

import { Subject, takeUntil } from 'rxjs';

export function onDestroyed() {
	const replaySubject = new Subject<void>();

	inject(DestroyRef).onDestroy(() => {
		replaySubject.next();
		replaySubject.complete();
	});

	return <T>() => takeUntil<T>(replaySubject.asObservable());
}
