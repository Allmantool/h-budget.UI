import { NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MatDividerModule } from '@angular/material/divider';

@Component({
	selector: 'app-divider',
	templateUrl: './app-divider.component.html',
	styleUrls: ['./app-divider.component.css'],
	changeDetection: ChangeDetectionStrategy.OnPush,
	standalone: true,
	imports: [NgIf, MatDividerModule],
})
export class AppDividerComponent {
	@Input() isVertical = true;
}
