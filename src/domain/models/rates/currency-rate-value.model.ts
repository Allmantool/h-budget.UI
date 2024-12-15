import { DataPoint } from '../../../presentation/currency-rates/types/data-point.type';

export class CurrencyRateValueModel {
	constructor(currencyRate?: Partial<CurrencyRateValueModel>) {
		if (!currencyRate) {
			return;
		}

		this.officialRate = currencyRate.officialRate;
		this.updateDate = currencyRate.updateDate;
		this.ratePerUnit = currencyRate.ratePerUnit;
	}

	ratePerUnit?: number;
	updateDate?: Date;
	officialRate?: number;

	fromDataPoint(dataPoint: DataPoint): CurrencyRateValueModel {
		let updateDate: Date | undefined;
		let ratePerUnit: number | undefined;

		if (Array.isArray(dataPoint)) {
			if (dataPoint[0] instanceof Date) {
				updateDate = dataPoint[0];
			} else if (typeof dataPoint[0] === 'number') {
				updateDate = new Date();
			}
			ratePerUnit = dataPoint[1];
		} else if ('x' in dataPoint && 'y' in dataPoint) {
			updateDate = dataPoint.x instanceof Date ? dataPoint.x : new Date();
			ratePerUnit = dataPoint.y;
		}

		return new CurrencyRateValueModel({
			updateDate,
			ratePerUnit,
			officialRate: ratePerUnit,
		});
	}
}
