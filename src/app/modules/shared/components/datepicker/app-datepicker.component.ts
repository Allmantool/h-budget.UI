/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @angular-eslint/no-output-on-prefix */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { ChangeDetectionStrategy, Component, EventEmitter, forwardRef, Input, Output } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatDatepickerInputEvent } from '@angular/material/datepicker';

import { BehaviorSubject } from 'rxjs';

@Component({
	selector: 'app-datepicker',
	templateUrl: './app-datepicker.component.html',
	styleUrls: ['./app-datepicker.component.css'],
	providers: [
		{
			provide: NG_VALUE_ACCESSOR,
			useExisting: forwardRef(() => DatepickerComponent),
			multi: true,
		},
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatepickerComponent implements ControlValueAccessor {
	private onTouched!: Function;
	private onChanged!: (value: Date | null) => {};

	@Input() public disabled: boolean = false;

	@Input() public placeholder: string = 'Choose a date';

	@Input() public dateFormat: string = 'MM/DD/YYYY';

	@Output() public onDateChanged = new EventEmitter<Date | null>();

	public data$: BehaviorSubject<Date | null> = new BehaviorSubject<Date | null>(null);

	writeValue(value: Date | null): void {
		this.data$.next(value);
	}

	registerOnChange(fn: (value: any) => {}): void {
		this.onChanged = fn;
	}

	registerOnTouched(fn: Function): void {
		this.onTouched = fn;
	}

	updateValue(event: MatDatepickerInputEvent<Date, string>) {
		this.data$.next(event.value);

		this.onChanged(this.data$.value);
		this.onTouched();

		this.onDateChanged.emit(this.data$.value);
	}
}
