/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/ban-types */

import { ChangeDetectionStrategy, Component, EventEmitter, forwardRef, Input, Output } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

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

	@Input() public disabled: boolean = false;
	@Input() public fieldType: string = InputTypes.INPUT;

	@Input() public selectOptions: string[] = [];

	@Input() public title: string = '';

	@Input() public numberInputPrefix: string = '';

	@Input() public defaultValue: FormInput = undefined;

	// eslint-disable-next-line @angular-eslint/no-output-on-prefix
	@Output() public onDataChanged = new EventEmitter<string | number | undefined>();

	public data$ = new BehaviorSubject<FormInput>(this.defaultValue ?? undefined);

	public writeValue(value: FormInput): void {
		this.data$.next(value);
	}

	public registerOnChange(fn: (value: FormInput) => {}): void {
		this.onChanged = fn;
	}

	public registerOnTouched(fn: Function): void {
		this.onTouched = fn;
	}

	public updateValue(event: any) {
		this.data$.next(event.value);

		this.onChanged(event.value);
		this.onTouched();

		this.onDataChanged.emit(this.data$.value);
	}

	public clearInput(event: any) {
		event.target.value = '';
		this.defaultValue = '';
	}

	public trackByFn(index: number, item: string): string {
		return item; // Replace with a unique identifier for each item
	}
}
