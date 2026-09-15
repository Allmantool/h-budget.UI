import { CurrencyFlagMetadata } from '../../../app/modules/shared/constants/currency-flag-metadata';

describe('currency flag metadata', () => {
	[
		['USD', 'us', 'United States'],
		['UAH', 'ua', 'Ukraine'],
		['EUR', 'eu', 'European Union'],
		['PLN', 'pl', 'Poland'],
		['RUB', 'ru', 'Russia'],
		['TRY', 'tr', 'Turkey'],
		['CNY', 'cn', 'China'],
		['THB', 'th', 'Thailand'],
		['BYN', 'by', 'Belarus'],
	].forEach(([currencyAbbreviation, countryCode, countryName]) => {
		it(`maps ${currencyAbbreviation} to ${countryName}`, () => {
			expect(CurrencyFlagMetadata.getByCurrencyAbbreviation(currencyAbbreviation)).toEqual({
				countryCode,
				countryName,
			});
		});
	});

	it('returns no metadata for an unsupported or missing currency abbreviation', () => {
		expect(CurrencyFlagMetadata.getByCurrencyAbbreviation('XXX')).toBeUndefined();
		expect(CurrencyFlagMetadata.getByCurrencyAbbreviation(null)).toBeUndefined();
	});
});
