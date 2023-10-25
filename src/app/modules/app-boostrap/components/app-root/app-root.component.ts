import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { Select } from '@ngxs/store';
import { BehaviorSubject, Observable, Subject, takeUntil } from 'rxjs';
import * as _ from 'lodash';

import { requestsUnderProcessing } from '../../../shared/store/states/core-app-root/selectors/core-app.selectores';

@Component({
	selector: 'app-root',
	templateUrl: './app-root.component.html',
	styleUrls: ['./app-root.component.css'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppRootComponent implements OnInit, OnDestroy {
	private destroy$ = new Subject<void>();

	@Select(requestsUnderProcessing)
	requestsUnderProcessing$!: Observable<string[]>;

	public isDataLoadeding$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

	public ngOnInit(): void {
		this.requestsUnderProcessing$.pipe(takeUntil(this.destroy$)).subscribe(requestIds => {
			if (_.isEmpty(requestIds)) {
				this.isDataLoadeding$.next(false);
				return;
			}

			this.isDataLoadeding$.next(true);
		});
	}

	public ngOnDestroy(): void {
		this.destroy$.next();
		this.destroy$.complete();
	}

	constructor(
		private readonly route: ActivatedRoute,
		private readonly router: Router
	) {}

	public async navigateToDashboardAsync(): Promise<void> {
		await this.router.navigate(['/'], { relativeTo: this.route });
	}
}
