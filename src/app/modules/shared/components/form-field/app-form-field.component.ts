/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/ban-types */
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';
import {
	Component,
	Input,
	forwardRef,
	ChangeDetectionStrategy,
	Output,
	EventEmitter,
} from '@angular/core';

import { BehaviorSubject } from 'rxjs';

import { InputTypes } from '../../models/input-types';
import { FormInput } from '../../types/form-input.type';

@Component({
	selector: 'app-form-field',
	templateUrl: './app-form-field.component.html',
	styleUrls: ['./app-form-field.component.css'],
	providers: [
		{
			provide: NG_VALUE_ACCESSOR,
			useExisting: forwardRef(() => AppFormFieldComponent),
			multi: true,
		},
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppFormFieldComponent implements ControlValueAccessor {
	private onTouched!: Function;
	private onChanged!: (value: FormInput) => {};

	private disabled = false;

	@Input() public fieldType: string = InputTypes.INPUT;

	@Input() public selectOptions: string[] = [];

	@Input() public title: string = '';

	@Input() public defaultValue: FormInput = '';

	// eslint-disable-next-line @angular-eslint/no-output-on-prefix
	@Output() public onDataChanged = new EventEmitter<string | number | undefined>();

	public data$ = new BehaviorSubject<FormInput>(this.defaultValue ?? undefined);

	public writeValue(value: any): void {
		this.data$.next(value);
	}

	public registerOnChange(fn: (value: any) => {}): void {
		this.onChanged = fn;
	}

	public registerOnTouched(fn: Function): void {
		this.onTouched = fn;
	}

	public setDisabledState(isDisabled: boolean) {
		this.disabled = isDisabled;
	}

	public updateValue(event: any) {
		this.data$.next(event.value);

		this.onChanged(this.data$.value);
		this.onTouched();

		this.onDataChanged.emit(this.data$.value);
	}

	public trackByFn(index: number, item: string): string {
		return item; // Replace with a unique identifier for each item
	}
}
