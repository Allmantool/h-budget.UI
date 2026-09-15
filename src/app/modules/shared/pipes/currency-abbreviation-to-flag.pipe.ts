import { Pipe, PipeTransform } from '@angular/core';

import { CurrencyFlagMetadata } from '../constants/currency-flag-metadata';

@Pipe({
	name: 'currencyAbbreviationToFlagFormat',
	standalone: true,
})
export class CurrencyAbbreviationToFlagFormatPipe implements PipeTransform {
	public transform(currencyAbbreviation: string | null | undefined): string {
		return CurrencyFlagMetadata.getByCurrencyAbbreviation(currencyAbbreviation)?.countryCode ?? '';
	}
}
