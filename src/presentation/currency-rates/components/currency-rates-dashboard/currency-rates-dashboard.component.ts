import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';

@Component({
	selector: 'currency-rates-dashboard.component',
	templateUrl: './currency-rates-dashboard.component.html',
	styleUrls: ['./currency-rates-dashboard.component.css'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CurrencyRatesDashboardComponent implements OnInit {
	constructor(private readonly title: Title) {}

	ngOnInit(): void {
		this.title.setTitle('H-Budget rates');
	}
}
