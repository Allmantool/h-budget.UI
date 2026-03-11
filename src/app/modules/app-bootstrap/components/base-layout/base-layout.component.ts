import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, Signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';

import * as _ from 'lodash';

import { Select } from '@ngxs/store';
import { BehaviorSubject, Observable } from 'rxjs';
import { filter, map, startWith } from 'rxjs/operators';

import { requestsUnderProcessing } from '../../../shared/store/states/core/selectors/core-app.selectors';

interface PrimaryNavigationItem {
	label: string;
	description: string;
	route: string;
	icon: string;
}

@Component({
	selector: 'base-layout',
	templateUrl: './base-layout.component.html',
	styleUrls: ['./base-layout.component.css'],
	changeDetection: ChangeDetectionStrategy.OnPush,
	standalone: false,
})
export class BaseLayoutComponent implements OnInit {
	private readonly destroyRef = inject(DestroyRef);
	public readonly primaryNavigationItems: PrimaryNavigationItem[] = [
		{
			label: 'Overview',
			description: 'Landing workspace and entry points',
			route: '/dashboard',
			icon: 'space_dashboard',
		},
		{
			label: 'Rates',
			description: 'Currency trends and market comparisons',
			route: '/dashboard/currency-rates',
			icon: 'monitoring',
		},
		{
			label: 'Accounting',
			description: 'Accounts, operations, and balances',
			route: '/dashboard/accounting',
			icon: 'account_balance_wallet',
		},
	];

	@Select(requestsUnderProcessing)
	requestsUnderProcessing$!: Observable<string[]>;

	public isDataLoading$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
	public readonly currentUrlSignal: Signal<string>;
	public readonly activeNavigationItemSignal: Signal<PrimaryNavigationItem | undefined>;

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
	) {
		const currentUrl$ = this.router.events.pipe(
			filter(event => event instanceof NavigationEnd),
			startWith(null),
			map(() => this.router.url)
		);

		this.currentUrlSignal = toSignal(currentUrl$, { initialValue: this.router.url });
		this.activeNavigationItemSignal = toSignal(
			currentUrl$.pipe(
				map(url =>
					_.findLast(this.primaryNavigationItems, navigationItem => url.startsWith(navigationItem.route))
				)
			),
			{ initialValue: this.primaryNavigationItems[0] }
		);
	}

	public async navigateToDashboardAsync(): Promise<void> {
		await this.router.navigate([''], { relativeTo: this.route });
	}

	public isRouteActive(route: string): boolean {
		const currentUrl = this.currentUrlSignal();

		if (route === '/dashboard') {
			return currentUrl === route;
		}

		return currentUrl.startsWith(route);
	}
}
