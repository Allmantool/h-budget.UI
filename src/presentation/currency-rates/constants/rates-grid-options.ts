import { CurrencyTrend } from 'app/modules/shared/store/models/currency-rates/currency-trend';

export class RatesGridColumnOptions {
	public static SELECT: string = 'select';
	public static ID: string = 'id';
	public static ABBREVIATION: string = 'abbreviation';
	public static NAME: string = 'name';
	public static RATE_PER_UNIT: string = 'ratePerUnit';
	public static PERCENTAGE_DIFF: string = 'percentageDiff';
	public static UPDATE_DATE: string = 'updateDate';

	public static DESCRIPTIONS: Map<string, string> = new Map<string, string>([
		[RatesGridColumnOptions.SELECT, ''],
		[RatesGridColumnOptions.ID, 'Id'],
		[RatesGridColumnOptions.ABBREVIATION, 'Abbreviation'],
		[RatesGridColumnOptions.NAME, 'Name'],
		[RatesGridColumnOptions.RATE_PER_UNIT, 'An unit rate'],
		[RatesGridColumnOptions.PERCENTAGE_DIFF, 'Trend'],
		[RatesGridColumnOptions.UPDATE_DATE, 'Last update date'],
	]);

	public static NAMES: string[] = [
		...RatesGridColumnOptions.DESCRIPTIONS.keys(),
	];

	public static TRENDS: { [trendDirection: string]: string } = {
		[CurrencyTrend.up]: 'LimeGreen',
		[CurrencyTrend.down]: 'crimson',
	};
}
