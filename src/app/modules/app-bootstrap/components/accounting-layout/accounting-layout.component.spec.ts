import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';

import { NgxsModule, Store } from '@ngxs/store';

import { AccountingLayoutComponent } from './accounting-layout.component';
import { ngxsConfig } from '../../../shared/store/ngxs.config';
import { AddProcessingRequest } from '../../../shared/store/states/core/actions/core-app.actions';
import { CoreAppState } from '../../../shared/store/states/core/core-app.state';

@Component({
	selector: 'accounting-layout-primary-route',
	standalone: true,
	template: 'primary accounting route',
})
class PrimaryRouteComponent {}

@Component({
	selector: 'accounting-layout-right-sidebar-route',
	standalone: true,
	template: 'right sidebar accounting route',
})
class RightSidebarRouteComponent {}

@Component({
	selector: 'accounting-layout-route-host',
	standalone: true,
	imports: [RouterOutlet],
	template: '<router-outlet></router-outlet>',
})
class AccountingLayoutRouteHostComponent {}

describe('AccountingLayoutComponent', () => {
	let fixture: ComponentFixture<AccountingLayoutComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [
				RouterTestingModule.withRoutes([
					{ path: 'dashboard', component: PrimaryRouteComponent },
					{ path: 'dashboard/currency-rates', component: PrimaryRouteComponent },
					{
						path: 'dashboard/accounting',
						component: PrimaryRouteComponent,
						children: [
							{ path: '', component: PrimaryRouteComponent },
							{ path: 'operations', component: PrimaryRouteComponent },
							{ path: '', outlet: 'right_sidebar', component: RightSidebarRouteComponent },
							{ path: 'operations', outlet: 'right_sidebar', component: RightSidebarRouteComponent },
						],
					},
				]),
				NgxsModule.forRoot([CoreAppState], ngxsConfig),
				AccountingLayoutComponent,
			],
		}).compileComponents();

		fixture = TestBed.createComponent(AccountingLayoutComponent);
	});

	it('creates as a standalone accounting route shell', () => {
		fixture.detectChanges();

		expect(fixture.componentInstance).toBeTruthy();
	});

	it('renders exactly one primary outlet and one right sidebar outlet in the expected order', () => {
		fixture.detectChanges();

		const outlets = fixture.debugElement.queryAll(By.directive(RouterOutlet));
		const outletNames = outlets.map(outlet => outlet.injector.get(RouterOutlet).name);

		expect(outletNames).toEqual(['primary', 'right_sidebar']);
	});

	it('keeps accounting navigation links in the expected order', () => {
		fixture.detectChanges();

		const links = fixture.debugElement
			.queryAll(By.directive(RouterLink))
			.filter(link => (link.nativeElement as HTMLElement).classList.contains('accounting-nav-item'));
		const linkElements = links.map(link => link.nativeElement as HTMLElement);
		const hrefs = linkElements.map(link => link.getAttribute('href'));
		const labels = linkElements.map(link => link.querySelector('strong')?.textContent?.trim());

		expect(labels).toEqual(['Overview', 'Rates', 'Accounting']);
		expect(hrefs).toEqual(['/dashboard', '/dashboard/currency-rates', '/dashboard/accounting']);
	});

	it('keeps the primary and right sidebar outlets in their layout regions', () => {
		fixture.detectChanges();

		const nativeElement = fixture.nativeElement as HTMLElement;
		const primaryOutlet = nativeElement.querySelector('.accounting-main__content router-outlet');
		const rightSidebarOutlet = nativeElement.querySelector(
			'.accounting-detail router-outlet[name="right_sidebar"]'
		);

		expect(primaryOutlet).not.toBeNull();
		expect(rightSidebarOutlet).not.toBeNull();
	});

	it('renders the loading overlay from the async-bound processing state', () => {
		const store = TestBed.inject(Store);

		fixture.detectChanges();

		store.dispatch(new AddProcessingRequest('accounting-layout-test-request'));
		fixture.detectChanges();

		const nativeElement = fixture.nativeElement as HTMLElement;

		expect(nativeElement.querySelector('.overlay')).not.toBeNull();
	});

	it('does not cover active routed accounting content when a request is still processing', async () => {
		fixture.destroy();
		TestBed.resetTestingModule();

		await TestBed.configureTestingModule({
			imports: [
				RouterTestingModule.withRoutes([
					{
						path: 'dashboard/accounting',
						component: AccountingLayoutComponent,
						children: [{ path: '', component: PrimaryRouteComponent }],
					},
				]),
				NgxsModule.forRoot([CoreAppState], ngxsConfig),
				AccountingLayoutRouteHostComponent,
			],
		}).compileComponents();

		const routedFixture = TestBed.createComponent(AccountingLayoutRouteHostComponent);
		const router = TestBed.inject(Router);
		const store = TestBed.inject(Store);

		await router.navigateByUrl('/dashboard/accounting');
		routedFixture.detectChanges();
		await routedFixture.whenStable();

		store.dispatch(new AddProcessingRequest('accounting-layout-active-route-request'));
		routedFixture.detectChanges();

		const nativeElement = routedFixture.nativeElement as HTMLElement;

		expect(nativeElement.textContent).toContain('primary accounting route');
		expect(nativeElement.querySelector('.overlay')).toBeNull();
	});
});
