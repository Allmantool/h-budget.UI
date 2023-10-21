import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
	selector: 'progress-spinner',
	templateUrl: './progress-spinner.component.html',
	styleUrls: ['./progress-spinner.component.css'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgressSpinnerComponent {
	@Input() isLoading: boolean | null = false;
}
