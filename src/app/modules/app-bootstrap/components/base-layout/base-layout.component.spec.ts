import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';

import { NgxsModule, Store } from '@ngxs/store';

import { BaseLayoutComponent } from './base-layout.component';
import { ngxsConfig } from '../../../shared/store/ngxs.config';
import {
	AddProcessingRequest,
	RemoveProcessingRequest,
} from '../../../shared/store/states/core/actions/core-app.actions';
import { CoreAppState } from '../../../shared/store/states/core/core-app.state';

@Component({
	standalone: true,
	template: 'dashboard route',
})
class DashboardRouteComponent {}

@Component({
	standalone: true,
	template: 'currency rates route',
})
class CurrencyRatesRouteComponent {}

@Component({
	standalone: true,
	template: 'accounting route',
})
class AccountingRouteComponent {}

describe('BaseLayoutComponent', () => {
	let fixture: ComponentFixture<BaseLayoutComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [
				RouterTestingModule.withRoutes([
					{
						path: 'dashboard',
						children: [
							{ path: '', component: DashboardRouteComponent },
							{ path: 'currency-rates', component: CurrencyRatesRouteComponent },
							{ path: 'accounting', component: AccountingRouteComponent },
						],
					},
				]),
				NgxsModule.forRoot([CoreAppState], ngxsConfig),
				BaseLayoutComponent,
			],
		}).compileComponents();

		fixture = TestBed.createComponent(BaseLayoutComponent);
	});

	it('creates as a standalone root shell', () => {
		fixture.detectChanges();

		expect(fixture.componentInstance).toBeTruthy();
	});

	it('renders exactly one root router outlet', () => {
		fixture.detectChanges();

		const outlets = fixture.debugElement.queryAll(By.directive(RouterOutlet));
		const outletNames = outlets.map(outlet => outlet.injector.get(RouterOutlet).name);

		expect(outletNames).toEqual(['primary']);
	});

	it('keeps primary navigation links in the expected order', () => {
		fixture.detectChanges();

		const links = fixture.debugElement.queryAll(By.directive(RouterLink));
		const linkElements = links.map(link => link.nativeElement as HTMLElement);
		const hrefs = linkElements.map(link => link.getAttribute('href'));
		const labels = linkElements.map(link => link.querySelector('strong')?.textContent?.trim());

		expect(labels).toEqual(['Overview', 'Rates', 'Accounting']);
		expect(hrefs).toEqual(['/dashboard', '/dashboard/currency-rates', '/dashboard/accounting']);
	});

	it('marks the active navigation item from the current router URL', async () => {
		const router = TestBed.inject(Router);

		await router.navigateByUrl('/dashboard/currency-rates');
		fixture.detectChanges();

		const activeLink = (fixture.nativeElement as HTMLElement).querySelector('.app-shell__nav-item--active');

		expect(activeLink?.textContent).toContain('Rates');
	});

	it('keeps the primary navigation and active tile heights stable across workspace routes', async () => {
		const router = TestBed.inject(Router);
		const shell = (fixture.nativeElement as HTMLElement).querySelector('.app-shell') as HTMLElement;
		const routes = ['/dashboard', '/dashboard/currency-rates', '/dashboard/accounting'];
		const viewportWidths = [1920, 1440, 1024];

		fixture.detectChanges();

		for (const viewportWidth of viewportWidths) {
			shell.style.width = `${viewportWidth}px`;
			const dimensions: Array<{ navigation: number; activeTile: number }> = [];

			for (const route of routes) {
				await router.navigateByUrl(route);
				fixture.detectChanges();
				await fixture.whenStable();
				fixture.detectChanges();

				const nativeElement = fixture.nativeElement as HTMLElement;
				const navigation = nativeElement.querySelector('.app-shell__nav') as HTMLElement;
				const activeTile = nativeElement.querySelector('.app-shell__nav-item--active') as HTMLElement;
				const subtitles = nativeElement.querySelectorAll<HTMLElement>('.app-shell__nav-copy small');

				expect(activeTile).withContext(`Expected an active tile for ${route}`).not.toBeNull();
				expect(subtitles.length).withContext(`Expected all subtitles for ${route}`).toBe(3);
				subtitles.forEach(subtitle => {
					expect(subtitle.scrollWidth)
						.withContext(`Expected the subtitle to fit within its tile for ${route} at ${viewportWidth}px`)
						.toBeLessThanOrEqual(subtitle.clientWidth);
				});

				dimensions.push({
					navigation: navigation.getBoundingClientRect().height,
					activeTile: activeTile.getBoundingClientRect().height,
				});
			}

			for (const dimension of dimensions.slice(1)) {
				expect(Math.abs(dimension.navigation - dimensions[0].navigation))
					.withContext(`Expected navigation height stability at ${viewportWidth}px`)
					.toBeLessThanOrEqual(0.5);
				expect(Math.abs(dimension.activeTile - dimensions[0].activeTile))
					.withContext(`Expected active tile height stability at ${viewportWidth}px`)
					.toBeLessThanOrEqual(0.5);
			}
		}
	});

	it('updates loader state from the NGXS processing state', () => {
		const store = TestBed.inject(Store);

		fixture.detectChanges();

		store.dispatch(new AddProcessingRequest('base-layout-test-request'));

		expect(fixture.componentInstance.isDataLoading$.value).toBeTrue();

		store.dispatch(new RemoveProcessingRequest('base-layout-test-request'));

		expect(fixture.componentInstance.isDataLoading$.value).toBeFalse();
	});
});
