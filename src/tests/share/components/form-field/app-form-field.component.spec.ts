import { TestBed } from '@angular/core/testing';

import { AppFormFieldComponent } from '../../../../app/modules/shared/components/form-field/app-form-field.component';
import { FormInput } from '../../../../app/modules/shared/types/form-input.type';

describe('app-form-field component', () => {
	let sut: AppFormFieldComponent;

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [],
			providers: [AppFormFieldComponent],
		});

		sut = TestBed.inject(AppFormFieldComponent);

		sut.disabled = false;
		sut.selectOptions = ['opt1'];
		sut.title = 'test-title';
		sut.numberInputPrefix = '1-prefix';
		sut.defaultValue = 'default-value';
	});

	it('"writeValue" should populate input element respectively', () => {
		const payload = 'some test value';
		sut.writeValue(payload as FormInput);

		expect(sut.data$.value).toBe(payload);
	});

	it('"registerOnChange" should set expected value on emit', () => {
		const payloadFn = (value: FormInput) => {
			sut.data$.next(value ?? 'old value');

			return {};
		};

		sut.registerOnChange(payloadFn);
		sut.registerOnTouched(() => {});

		sut.updateValue({
			value: 'new value',
		});

		expect(sut.data$.value).toBe('new value');
	});

	it('"registerOnTouched" should be triggered', () => {
		let hasOnTouchedBeenExecuted = false;

		const payloadFn = () => {
			hasOnTouchedBeenExecuted = true;
			return {};
		};

		sut.registerOnChange((_: FormInput) => 'test');
		sut.registerOnTouched(payloadFn);

		sut.updateValue({
			value: 'new value',
		});

		expect(hasOnTouchedBeenExecuted).toBeTruthy();
	});

	it('"updateValue" should set appropriate value', () => {
		sut.registerOnChange((_: FormInput) => 'test');
		sut.registerOnTouched(() => {});

		sut.updateValue({
			value: 'test-value',
		});

		expect(sut.data$.value).toBe('test-value');
	});

	it('"clearInput" should clear value', () => {
		sut.clearInput({
			target: {
				value: 'test-value',
			},
		});

		expect(sut.defaultValue).toBe('');
	});

	it('"trackByFn" should', () => {
		sut.trackByFn(1, 'item-1');
	});
});
