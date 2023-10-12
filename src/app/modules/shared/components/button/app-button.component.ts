import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
	selector: 'app-button',
	templateUrl: './app-button.component.html',
	styleUrls: ['./app-button.component.css'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppButtonComponent {
	@Input() public title: string = '';
}
