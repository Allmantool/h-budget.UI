/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { TestBed } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';

import { MainDashboardComponent } from './components/dashboard/main-dashboard.component';
import { MainDashboardCartComponent } from './components/dashboard-item/main-dashboard-cart.component';

describe('main dashboard component', () => {
	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [
				RouterTestingModule,
				NoopAnimationsModule,
				MatCardModule,
				MatButtonModule,
				MainDashboardCartComponent,
			],
			declarations: [MainDashboardComponent],
		}).compileComponents();
	});

	it('should create the app', () => {
		const fixture = TestBed.createComponent(MainDashboardComponent);
		const app = fixture.componentInstance;
		expect(app).toBeTruthy();
	});

	it(`should have as title 'h-budget'`, () => {
		const fixture = TestBed.createComponent(MainDashboardComponent);
		const app = fixture.componentInstance;
		expect(app.browserTitle).toEqual('H-Budget dashboard');
	});

	it('should have 2 sub sections: accouting & rates', () => {
		const fixture = TestBed.createComponent(MainDashboardComponent);
		fixture.detectChanges();

		const compiled: any = fixture.nativeElement;
		const cards = compiled.querySelectorAll('main-dashboard-cart');

		expect(cards.length).toBe(2);
	});
});
