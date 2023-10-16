import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
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
export class AppRootComponent implements OnInit {
	private destroy$ = new Subject<void>();

	@Select(requestsUnderProcessing)
	requestsUnderProcessing$!: Observable<string[]>;

	public isDataLoaded$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(true);

	ngOnInit(): void {
		this.requestsUnderProcessing$.pipe(takeUntil(this.destroy$)).subscribe((requestIds) => {
			if (_.isEmpty(requestIds)) {
				this.isDataLoaded$.next(true);
			}

			this.isDataLoaded$.next(false);
		});
	}

	ngOnDestroy(): void {
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
