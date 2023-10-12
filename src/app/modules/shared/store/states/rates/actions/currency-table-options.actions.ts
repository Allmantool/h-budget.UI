export class SetActiveCurrency {
	static readonly type = '[CURR-TABLE-OPTIONS] Set active currency';
	constructor(
		public id: number,
		public label: string
	) {}
}

export class SetCurrencyDateRange {
	static readonly type = '[CURR-TABLE-OPTIONS] Set currency date range';
	constructor(public amountOfMonths: number) {}
}
