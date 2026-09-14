import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { RouterOutlet } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';

import { NgxsModule, Store } from '@ngxs/store';

import { DashboardLayoutComponent } from './dashboard-layout.component';
import { ngxsConfig } from '../../../shared/store/ngxs.config';
import { AddProcessingRequest } from '../../../shared/store/states/core/actions/core-app.actions';
import { CoreAppState } from '../../../shared/store/states/core/core-app.state';

@Component({
	standalone: true,
	template: '',
})
class TestRouteComponent {}

describe('DashboardLayoutComponent', () => {
	let fixture: ComponentFixture<DashboardLayoutComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [
				RouterTestingModule.withRoutes([
					{ path: 'dashboard', component: TestRouteComponent },
					{ path: 'dashboard/currency-rates', component: TestRouteComponent },
					{ path: 'dashboard/accounting', component: TestRouteComponent },
				]),
				NgxsModule.forRoot([CoreAppState], ngxsConfig),
				DashboardLayoutComponent,
			],
		}).compileComponents();

		fixture = TestBed.createComponent(DashboardLayoutComponent);
	});

	it('creates as a standalone route shell', () => {
		fixture.detectChanges();

		expect(fixture.componentInstance).toBeTruthy();
	});

	it('renders only the primary outlet because the app shell owns navigation', () => {
		fixture.detectChanges();

		const outlets = fixture.debugElement.queryAll(By.directive(RouterOutlet));
		const outletNames = outlets.map(outlet => outlet.injector.get(RouterOutlet).name);

		expect(outletNames).toEqual(['primary']);
	});

	it('renders a compact workspace context without duplicated navigation', () => {
		fixture.detectChanges();

		const nativeElement = fixture.nativeElement as HTMLElement;

		expect(nativeElement.textContent).toContain('Workspace');
		expect(nativeElement.querySelector('.workspace-sidebar')).toBeNull();
	});

	it('renders the loading overlay from the async-bound processing state', () => {
		const store = TestBed.inject(Store);

		fixture.detectChanges();

		store.dispatch(new AddProcessingRequest('dashboard-layout-test-request'));
		fixture.detectChanges();

		const nativeElement = fixture.nativeElement as HTMLElement;

		expect(nativeElement.querySelector('.overlay')).not.toBeNull();
	});
});
