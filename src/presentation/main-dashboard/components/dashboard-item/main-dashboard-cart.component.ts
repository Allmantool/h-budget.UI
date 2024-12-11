import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
	selector: 'main-dashboard-cart',
	templateUrl: './main-dashboard-cart.component.html',
	styleUrls: ['./main-dashboard-cart.component.css'],
	changeDetection: ChangeDetectionStrategy.OnPush,
	standalone: false
})
export class MainDashboardCartComponent {
	@Input() description: string = '';
	@Input() title: string = '';
	@Input() subtitle: string = '';
	@Input() navigateLink: string = '';
	@Input() imagePath: string = '';

	constructor(
		private route: ActivatedRoute,
		private router: Router
	) {}

	public async navigate(): Promise<void> {
		await this.router.navigate([this.navigateLink], { relativeTo: this.route });
	}
}
