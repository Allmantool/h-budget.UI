import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
	selector: 'app-divider',
	templateUrl: './app-divider.component.html',
	styleUrls: ['./app-divider.component.css'],
	changeDetection: ChangeDetectionStrategy.OnPush,
	standalone: false
})
export class AppDividerComponent {
	@Input() isVertical = true;
}
