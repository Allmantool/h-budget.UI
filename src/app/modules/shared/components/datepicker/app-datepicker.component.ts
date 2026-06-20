/* eslint-disable @angular-eslint/no-output-on-prefix */

import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, forwardRef, Input, OnInit, Output } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerInputEvent } from '@angular/material/datepicker';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

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
	standalone: true,
	imports: [AsyncPipe, MatDatepickerModule, MatFormFieldModule, MatInputModule, MatNativeDateModule],
})
export class DatepickerComponent implements ControlValueAccessor, OnInit {
	private onTouched!: () => void;
	private onChanged!: (value: Date | null) => void;

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

	public registerOnChange(fn: (value: Date | null) => void): void {
		this.onChanged = fn;
	}

	public registerOnTouched(fn: () => void): void {
		this.onTouched = fn;
	}

	public updateValue(event: MatDatepickerInputEvent<Date, string>): void {
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
