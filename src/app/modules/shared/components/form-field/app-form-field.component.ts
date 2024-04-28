/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/ban-types */

import { ChangeDetectionStrategy, Component, EventEmitter, forwardRef, Input, OnInit, Output } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

import _ from 'lodash';

import { BehaviorSubject } from 'rxjs';

import { InputTypes } from '../../models/input-types';
import { SelectDropdownOptions } from '../../models/select-dropdown-options';
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
export class AppFormFieldComponent implements ControlValueAccessor, OnInit {
	private onTouched!: Function;
	private onChanged!: (value: FormInput) => {};

	@Input() public disabled: boolean = false;
	@Input() public fieldType: string = InputTypes.INPUT;

	@Input() public selectOptions: string[] | SelectDropdownOptions[] | undefined;

	@Input() public title: string = '';

	@Input() public numberInputPrefix: string = '';

	@Input() public defaultValue: FormInput;

	// eslint-disable-next-line @angular-eslint/no-output-on-prefix
	@Output() public onDataChanged = new EventEmitter<FormInput>();

	public data$ = new BehaviorSubject<FormInput>(undefined);

	public dropdownOptions$ = new BehaviorSubject<SelectDropdownOptions[]>([]);

	ngOnInit(): void {
		if (_.isNil(this.selectOptions)) {
			return;
		}

		if (typeof this.selectOptions[0] === 'object') {
			this.dropdownOptions$.next(this.selectOptions as SelectDropdownOptions[]);
			this.data$.next((this.defaultValue as SelectDropdownOptions).value);
			return;
		}

		this.dropdownOptions$.next(
			_.map(
				this.selectOptions,
				opt => new SelectDropdownOptions({ decription: opt as string, value: opt as string })
			)
		);

		this.data$.next(this.defaultValue);
	}

	public writeValue(value: FormInput): void {
		if (_.isNil(value)) {
			return;
		}

		this.data$.next(value);

		this.onDataChanged.emit(value);
	}

	public registerOnChange(fn: (value: FormInput) => {}): void {
		this.onChanged = fn;
	}

	public registerOnTouched(fn: Function): void {
		this.onTouched = fn;
	}

	public updateValue(event: any) {
		const selectedOption = _.find(this.dropdownOptions$.value, opt => opt.value === event.value);
		this.data$.next(event.value);

		this.onChanged(selectedOption);
		this.onTouched();

		this.onDataChanged.emit(selectedOption);
	}

	public clearInput(event: any) {
		event.target.value = '';
		this.defaultValue = '';
	}

	public trackByFn(index: number, item: SelectDropdownOptions): SelectDropdownOptions {
		return item; // Replace with a unique identifier for each item
	}
}
