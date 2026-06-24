import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, Signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';

import * as _ from 'lodash';

import { Select } from '@ngxs/store';
import { BehaviorSubject, Observable } from 'rxjs';
import { filter, map, startWith } from 'rxjs/operators';

import { ProgressSpinnerComponent } from '../../../shared/components/progress-spinner/progress-spinner.component';
import { requestsUnderProcessing } from '../../../shared/store/states/core/selectors/core-app.selectors';

interface AccountingNavigationItem {
	label: string;
	description: string;
	route: string;
	icon: string;
}

@Component({
	selector: 'accounting-layout',
	templateUrl: './accounting-layout.component.html',
	styleUrls: ['./accounting-layout.component.css'],
	changeDetection: ChangeDetectionStrategy.OnPush,
	standalone: true,
	imports: [AsyncPipe, MatButtonModule, RouterLink, RouterOutlet, ProgressSpinnerComponent],
})
export class AccountingLayoutComponent implements OnInit {
	private readonly destroyRef = inject(DestroyRef);
	public readonly navigationItems: AccountingNavigationItem[] = [
		{
			label: 'Overview',
			description: 'Return to dashboard landing',
			route: '/dashboard',
			icon: 'home',
		},
		{
			label: 'Rates',
			description: 'Inspect currencies and comparisons',
			route: '/dashboard/currency-rates',
			icon: 'currency_exchange',
		},
		{
			label: 'Accounting',
			description: 'Manage accounts and operations',
			route: '/dashboard/accounting',
			icon: 'receipt_long',
		},
	];

	@Select(requestsUnderProcessing)
	requestsUnderProcessing$!: Observable<string[]>;

	public isDataLoading$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
	public readonly currentUrlSignal: Signal<string>;

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
	}

	public async navigateToDashboardAsync(): Promise<void> {
		await this.router.navigate(['/'], { relativeTo: this.route });
	}

	public isRouteActive(route: string): boolean {
		const currentUrl = this.currentUrlSignal();

		if (route === '/dashboard') {
			return currentUrl === route;
		}

		return currentUrl.startsWith(route);
	}
}
