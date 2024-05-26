import { Pipe, PipeTransform } from '@angular/core';

import * as _ from 'lodash';

@Pipe({
	name: 'currencyAbbreviationToFlagFormat',
})
export class CurrencyAbbreviationToFlagFormatPipe implements PipeTransform {
	public transform(currencyAbbreviation: string): string {
		return _.isNil(currencyAbbreviation) ? '' : _.lowerCase(currencyAbbreviation.slice(0, 2));
	}
}
