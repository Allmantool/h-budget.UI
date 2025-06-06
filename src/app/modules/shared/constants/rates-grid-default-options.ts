import { CurrencyAbbreviations } from './rates-abbreviations';
import { RatesCodes } from './rates-codes';

export class RatesGridDefaultOptions {
	public static readonly PERIOD_IN_MONTHS_AMOUNT: number = 3;
	public static readonly RATE_DIFF_PRECISION: number = 3;

	public static readonly CURRENCY_ID: number = RatesCodes.USD;
	public static readonly CURRENCY_ABBREVIATION: string = CurrencyAbbreviations.USD;
}
