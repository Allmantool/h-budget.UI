import { CurrencyAbbrevitions } from './rates-abbreviations';
import { RatesCodes } from './rates-codes';

export class RatesGridDefaultOptions {
	public static readonly PERIOD_IN_MONTHS_AMMOUNT: number = 3;
	public static readonly RATE_DIFF_PRECISION: number = 2;

	public static readonly CURRENCY_ID: number = RatesCodes.USD;
	public static readonly CURRENCY_ABBREVIATION: string = CurrencyAbbrevitions.USD;
}
