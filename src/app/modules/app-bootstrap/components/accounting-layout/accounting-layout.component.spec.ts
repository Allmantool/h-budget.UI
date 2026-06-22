import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { RouterLink, RouterOutlet } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';

import { NgxsModule, Store } from '@ngxs/store';

import { AccountingLayoutComponent } from './accounting-layout.component';
import { ngxsConfig } from '../../../shared/store/ngxs.config';
import { AddProcessingRequest } from '../../../shared/store/states/core/actions/core-app.actions';
import { CoreAppState } from '../../../shared/store/states/core/core-app.state';

@Component({
	standalone: true,
	template: 'primary accounting route',
})
class PrimaryRouteComponent {}

@Component({
	standalone: true,
	template: 'right sidebar accounting route',
})
class RightSidebarRouteComponent {}

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
});
