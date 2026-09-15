import { CurrencyFlagDetails } from '../models/currency-flag-details';

export class CurrencyFlagMetadata {
	private static readonly countryByCurrencyAbbreviation: ReadonlyMap<string, CurrencyFlagDetails> = new Map([
		['BYN', { countryCode: 'by', countryName: 'Belarus' }],
		['CNY', { countryCode: 'cn', countryName: 'China' }],
		['EUR', { countryCode: 'eu', countryName: 'European Union' }],
		['PLN', { countryCode: 'pl', countryName: 'Poland' }],
		['RUB', { countryCode: 'ru', countryName: 'Russia' }],
		['THB', { countryCode: 'th', countryName: 'Thailand' }],
		['TRY', { countryCode: 'tr', countryName: 'Turkey' }],
		['UAH', { countryCode: 'ua', countryName: 'Ukraine' }],
		['USD', { countryCode: 'us', countryName: 'United States' }],
	]);

	public static getByCurrencyAbbreviation(
		currencyAbbreviation: string | null | undefined
	): CurrencyFlagDetails | undefined {
		return currencyAbbreviation
			? CurrencyFlagMetadata.countryByCurrencyAbbreviation.get(currencyAbbreviation.toUpperCase())
			: undefined;
	}
}
