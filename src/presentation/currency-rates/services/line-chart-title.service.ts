import * as _ from 'lodash';

import { CurrencyChartTitle } from '../../../app/modules/shared/store/models/currency-rates/currency-chart-title';

export class LineChartTitleService {
	public static calculateTitle(
		abbreviation: string,
		rateValuesForPeriod: number[]
	): CurrencyChartTitle {
		const trend =
			LineChartTitleService.getPeriodTrendInPercentage(
				rateValuesForPeriod
			);

		if (trend > 0) {
			return {
				text: `${abbreviation} \u2191 (+${trend} %)`,
				style: {
					color: '#32CD32',
				},
			};
		}

		if (trend < 0) {
			return {
				text: `${abbreviation} \u2193 (${trend} %)`,
				style: {
					color: '#FF0000',
				},
			};
		}

		return {
			text: abbreviation,
			style: {
				color: '#000000',
			},
		};
	}

	private static getPeriodTrendInPercentage(allRates: number[]): number {
		if (_.isNil(allRates) || _.isEmpty(allRates)) {
			return 0;
		}

		const diffForThePeriod = _.last(allRates)! - _.first(allRates)!;

		return _.round((diffForThePeriod / _.first(allRates)!) * 100, 3);
	}
}
