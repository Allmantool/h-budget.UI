import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';

import * as _ from 'lodash';

import { Select } from '@ngxs/store';
import { BehaviorSubject, Observable } from 'rxjs';

import { requestsUnderProcessing } from '../../../shared/store/states/core-app-root/selectors/core-app.selectores';

@Component({
	selector: 'app-root',
	templateUrl: './app-root.component.html',
	styleUrls: ['./app-root.component.css'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppRootComponent implements OnInit {
	private readonly destroyRef = inject(DestroyRef);

	@Select(requestsUnderProcessing)
	requestsUnderProcessing$!: Observable<string[]>;

	public isDataLoadeding$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

	public ngOnInit(): void {
		this.requestsUnderProcessing$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(requestIds => {
			if (_.isEmpty(requestIds)) {
				this.isDataLoadeding$.next(false);
				return;
			}

			this.isDataLoadeding$.next(true);
		});
	}

	constructor(
		private readonly route: ActivatedRoute,
		private readonly router: Router
	) {}

	public async navigateToDashboardAsync(): Promise<void> {
		await this.router.navigate(['/'], { relativeTo: this.route });
	}
}
