import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';

import * as _ from 'lodash';

import { Select } from '@ngxs/store';
import { BehaviorSubject, Observable } from 'rxjs';

import { requestsUnderProcessing } from '../../../shared/store/states/core/selectors/core-app.selectors';

@Component({
	selector: 'dashboard-layout',
	templateUrl: './dashboard-layout.component.html',
	styleUrls: ['./dashboard-layout.component.css'],
	changeDetection: ChangeDetectionStrategy.OnPush,
	standalone: false
})
export class DashboardLayoutComponent implements OnInit {
	public showFiller = false;
	private readonly destroyRef = inject(DestroyRef);

	@Select(requestsUnderProcessing)
	requestsUnderProcessing$!: Observable<string[]>;

	public isDataLoading$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

	public ngOnInit(): void {
		this.requestsUnderProcessing$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(requestIds => {
			if (_.isEmpty(requestIds)) {
				this.isDataLoading$.next(false);
				return;
			}

			this.isDataLoading$.next(true);
		});
	}

	constructor(
		private readonly route: ActivatedRoute,
		private readonly router: Router
	) {}

	public async navigateToDashboardAsync(): Promise<void> {
		await this.router.navigate([''], { relativeTo: this.route });
	}

	public async navigateToRatesAsync(): Promise<void> {
		await this.router.navigate(['/dashboard/currency-rates'], { relativeTo: this.route });
	}

	public async navigateToAccountingAsync(): Promise<void> {
		await this.router.navigate(['/dashboard/accounting'], { relativeTo: this.route });
	}
}
