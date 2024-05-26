import { Pipe, PipeTransform } from '@angular/core';

import * as _ from 'lodash';

import { FormInput } from '../types/form-input.type';

@Pipe({
	name: 'accountingCurrencyFormat',
})
export class AccountingCurrencyFormatPipe implements PipeTransform {
	public transform(value: FormInput | null): number | null {
		return _.isNil(value) || value == 0 ? null : Number(value);
	}
}
