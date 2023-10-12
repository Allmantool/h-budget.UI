export class SetActiveCurrencyTrendTitle {
	static readonly type =
		'[CURR-CHART-OPTIONS] Set chart currency trend title';
	constructor(public activeCurrencyTitle: string) {}
}
