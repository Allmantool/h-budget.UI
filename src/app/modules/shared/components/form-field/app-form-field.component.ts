/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-argument */

import { AsyncPipe, NgFor, NgSwitch, NgSwitchCase, NgSwitchDefault, NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, forwardRef, Input, Output } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import _ from 'lodash';

import { BehaviorSubject } from 'rxjs';

import { DefaultInputTypeValuesFactory } from '../../factories/default-type-values.factory';
import { InputTypes } from '../../models/input-types';
import { SelectDropdownOptions } from '../../models/select-dropdown-options';
import { AccountingCurrencyFormatPipe } from '../../pipes/accounting-currency.pipe';
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
	standalone: true,
	imports: [
		AsyncPipe,
		NgFor,
		NgSwitch,
		NgSwitchCase,
		NgSwitchDefault,
		NgTemplateOutlet,
		MatFormFieldModule,
		MatInputModule,
		MatSelectModule,
		AccountingCurrencyFormatPipe,
	],
})
export class AppFormFieldComponent implements ControlValueAccessor {
	private onTouched!: () => void;
	private onChanged!: (value: FormInput) => void;

	@Input() public disabled: boolean = false;
	@Input() public fieldType: string = InputTypes.INPUT;

	@Input() public title: string = '';

	@Input() public numberInputPrefix: string = '';

	@Input() public defaultValue: FormInput;

	// eslint-disable-next-line @angular-eslint/no-output-on-prefix
	@Output() public onDataChanged = new EventEmitter<FormInput>();

	@Input() set selectOptions(dropdownOptions: string[] | SelectDropdownOptions[] | null | undefined) {
		if (_.isNil(dropdownOptions)) {
			return;
		}

		if (typeof dropdownOptions === 'object') {
			const dropdownsOptions = dropdownOptions as SelectDropdownOptions[];

			this.dropdownOptions$.next(dropdownsOptions);

			const defaultOption = this.defaultValue as SelectDropdownOptions;

			if (!_.isNil(defaultOption)) {
				this.data$.next(defaultOption?.value ?? defaultOption);
			}

			return;
		}

		this.dropdownOptions$.next(
			_.map(dropdownOptions, opt => new SelectDropdownOptions({ description: opt, value: opt }))
		);

		if (!_.isNil(this.defaultValue)) {
			this.data$.next(this.defaultValue);
		}
	}

	public data$ = new BehaviorSubject<FormInput>(undefined);

	public dropdownOptions$ = new BehaviorSubject<SelectDropdownOptions[]>([]);

	constructor(private readonly inputTypeValuesFactory: DefaultInputTypeValuesFactory) {}

	public writeValue(value: FormInput): void {
		if (_.isNil(value)) {
			return;
		}

		this.data$.next(value);

		this.onDataChanged.emit(value);
	}

	public registerOnChange(fn: (value: FormInput) => void): void {
		this.onChanged = fn;
	}

	public registerOnTouched(fn: () => void): void {
		this.onTouched = fn;
	}

	public updateValue(event: any) {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const valueForUpdate = event.value;
		const selectedOption = _.find(this.dropdownOptions$.value, opt => (opt?.value ?? opt) === valueForUpdate);
		const inputPayload = (selectedOption ?? valueForUpdate) as FormInput;

		this.data$.next(valueForUpdate);

		this.onChanged(inputPayload);
		this.onTouched();

		this.onDataChanged.emit(inputPayload);
	}

	public clearInput(event: any) {
		const cleanDefaultValue = this.inputTypeValuesFactory.GetDefault(event.target.type);

		event.target.value = cleanDefaultValue;
		this.defaultValue = cleanDefaultValue;

		this.onChanged(cleanDefaultValue);
		this.onTouched();

		this.onDataChanged.emit(cleanDefaultValue);
	}

	public trackByFn(index: number, item: SelectDropdownOptions): string {
		return item.value! + index; // Replace with a unique identifier for each item
	}
}
