/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @angular-eslint/no-output-on-prefix */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { ChangeDetectionStrategy, Component, EventEmitter, forwardRef, Input, OnInit, Output } from '@angular/core';
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
	standalone: false
})
export class DatepickerComponent implements ControlValueAccessor, OnInit {
	private onTouched!: Function;
	private onChanged!: (value: Date | null) => {};

	@Input() public disabled: boolean = false;

	@Input() public placeholder: string = 'Choose a date';

	@Input() public dateFormat: string = 'MM/DD/YYYY';

	@Input() public defaultValue: Date = new Date();

	@Output() public onDateChanged = new EventEmitter<Date | null>();

	public data$: BehaviorSubject<Date | null> = new BehaviorSubject<Date | null>(null);

	ngOnInit(): void {
		this.data$.next(this.defaultValue);
	}

	public writeValue(value: Date | null): void {
		this.data$.next(value);
	}

	public registerOnChange(fn: (value: any) => {}): void {
		this.onChanged = fn;
	}

	public registerOnTouched(fn: Function): void {
		this.onTouched = fn;
	}

	public updateValue(event: MatDatepickerInputEvent<Date, string>) {
		const dateValue = event.value;

		this.data$.next(dateValue);

		if (this.onChanged) {
			this.onChanged(this.data$.value);
		}

		if (this.onTouched) {
			this.onTouched();
		}

		this.onDateChanged.emit(this.data$.value);
	}
}
