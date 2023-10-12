import { DestroyRef, inject } from '@angular/core';

import { ReplaySubject, takeUntil } from 'rxjs';

export function destroyed() {
	const replaySubject = new ReplaySubject(1);

	inject(DestroyRef).onDestroy(() => {
		replaySubject.next(true);
		replaySubject.complete();
	});

	return <T>() => takeUntil<T>(replaySubject.asObservable());
}
