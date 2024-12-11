import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
	selector: 'app-button',
	templateUrl: './app-button.component.html',
	styleUrls: ['./app-button.component.css'],
	changeDetection: ChangeDetectionStrategy.OnPush,
	standalone: false
})
export class AppButtonComponent {
	@Input() public text: string = '';
	@Input() public isDisabled: boolean = false;
	@Input() public icon: string = '';
	@Input() public color: 'primary' | 'accent' | 'warn' = 'primary';
	@Input() public type: 'raised' | 'stroked' | 'flat' | 'fab' | 'menu' = 'raised';

	@Output() onclick: EventEmitter<void> = new EventEmitter<void>();
}
