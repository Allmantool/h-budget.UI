import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, Signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';

import * as _ from 'lodash';

import { Select } from '@ngxs/store';
import { BehaviorSubject, Observable } from 'rxjs';
import { filter, map, startWith } from 'rxjs/operators';

import { ProgressSpinnerComponent } from '../../../shared/components/progress-spinner/progress-spinner.component';
import { requestsUnderProcessing } from '../../../shared/store/states/core/selectors/core-app.selectors';

interface WorkspaceNavigationItem {
	label: string;
	description: string;
	route: string;
	icon: string;
}

@Component({
	selector: 'dashboard-layout',
	templateUrl: './dashboard-layout.component.html',
	styleUrls: ['./dashboard-layout.component.css'],
	changeDetection: ChangeDetectionStrategy.OnPush,
	standalone: true,
	imports: [AsyncPipe, RouterOutlet, ProgressSpinnerComponent],
})
export class DashboardLayoutComponent implements OnInit {
	private readonly destroyRef = inject(DestroyRef);
	public readonly navigationItems: WorkspaceNavigationItem[] = [
		{
			label: 'Overview',
			description: 'Entry point and product overview',
			route: '/dashboard',
			icon: 'home',
		},
		{
			label: 'Rates',
			description: 'Currency history, charts, and peer comparison',
			route: '/dashboard/currency-rates',
			icon: 'currency_exchange',
		},
		{
			label: 'Accounting',
			description: 'Accounts and payment operations',
			route: '/dashboard/accounting',
			icon: 'account_balance',
		},
	];

	@Select(requestsUnderProcessing)
	requestsUnderProcessing$!: Observable<string[]>;

	public isDataLoading$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
	public readonly currentSectionSignal: Signal<WorkspaceNavigationItem | undefined>;

	public ngOnInit(): void {
		this.requestsUnderProcessing$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(requestIds => {
			if (_.isEmpty(requestIds)) {
				this.isDataLoading$.next(false);
				return;
			}

			this.isDataLoading$.next(true);
		});
	}

	constructor(private readonly router: Router) {
		const currentUrl$ = this.router.events.pipe(
			filter(event => event instanceof NavigationEnd),
			startWith(null),
			map(() => this.router.url)
		);

		this.currentSectionSignal = toSignal(
			currentUrl$.pipe(
				map(url => _.findLast(this.navigationItems, navigationItem => url.startsWith(navigationItem.route)))
			),
			{ initialValue: this.navigationItems[0] }
		);
	}
}
