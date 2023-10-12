import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
	selector: 'progress-bar',
	templateUrl: './progress-bar.component.html',
	styleUrls: ['./progress-bar.component.css'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgressBarComponent {
	@Input() isLoading: boolean | null = false;
}
