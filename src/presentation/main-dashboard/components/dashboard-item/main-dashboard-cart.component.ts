import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
	selector: 'main-dashboard-cart',
	templateUrl: './main-dashboard-cart.component.html',
	styleUrls: ['./main-dashboard-cart.component.css'],
	changeDetection: ChangeDetectionStrategy.OnPush,
	standalone: true,
	imports: [MatButtonModule, MatCardModule],
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
