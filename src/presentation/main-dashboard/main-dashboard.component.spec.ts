import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { MainDashboardComponent } from './components/dashboard/main-dashboard.component';

describe('AppComponent', () => {
	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [RouterTestingModule],
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
		const titleSpan = compiled.querySelector('.content');

		expect(titleSpan.children.length).toBe(2);
	});
});
