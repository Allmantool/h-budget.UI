import { Injectable } from '@angular/core';

import { FormInput } from '../types/form-input.type';

@Injectable({
	providedIn: 'root',
})
export class DefaultInputTypeValuesFactory {
	public GetDefault(valuetype: string): FormInput {
		let payload: FormInput = undefined;

		switch (valuetype) {
			case 'number': {
				payload = 0;
				break;
			}
			default: {
				break;
			}
		}

		return payload;
	}
}
