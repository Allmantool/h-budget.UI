import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { Location } from '@angular/common';

@Component({
	selector: 'main-dashboard',
	templateUrl: './main-dashboard.component.html',
	styleUrls: ['./main-dashboard.component.css'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainDashboardComponent implements OnInit {
	constructor(
		private readonly location: Location,
		private readonly meta: Meta,
		private readonly title: Title
	) {}

	ngOnInit(): void {
		this.title.setTitle(this.browserTitle);
		this.meta.updateTag({ name: 'site', content: 'H-Budget' });
	}

	public browserTitle = 'H-Budget dashboard';

	public navigateTo(url: string): void {
		this.location.go(url);
	}

	public goBack(): void {
		this.location.back();
	}

	public goForward(): void {
		this.location.forward();
	}
}
