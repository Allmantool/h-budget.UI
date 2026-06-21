/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';

import { MainDashboardComponent } from './components/dashboard/main-dashboard.component';
import { MainDashboardCartComponent } from './components/dashboard-item/main-dashboard-cart.component';

describe('main dashboard component', () => {
	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [RouterTestingModule, NoopAnimationsModule, MainDashboardComponent],
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

	it('should bind dashboard cards in the expected order with route targets', () => {
		const fixture = TestBed.createComponent(MainDashboardComponent);
		fixture.detectChanges();

		const cards = fixture.debugElement
			.queryAll(By.directive(MainDashboardCartComponent))
			.map(card => card.componentInstance as MainDashboardCartComponent);

		expect(cards.map(card => card.title)).toEqual(['Currencies', 'Accounting']);
		expect(cards.map(card => card.subtitle)).toEqual(['Currency rates information', 'Financial operations']);
		expect(cards.map(card => card.imagePath)).toEqual(['/assets/currency-rates.png', '/assets/accounting-v2.jpg']);
		expect(cards.map(card => card.navigateLink)).toEqual(['/dashboard/currency-rates', '/dashboard/accounting']);
		expect(cards.map(card => card.description)).toEqual([
			'Review market trends, compare currencies, and inspect historical movement with interactive charts.',
			'Manage accounts, inspect operations, and work with detail panels without breaking your flow.',
		]);
	});
});
