import * as _ from 'lodash';

import { HexColors } from '../../../app/modules/shared/constants/hex-colors';
import { ICurrencyChartTitle } from '../../../app/modules/shared/store/models/currency-rates/currency-chart-title';
import { RatesGridDefaultOptions } from '../../../app/modules/shared/constants/rates-grid-default-options';

export class LineChartTitleService {
	public static calculateTitle(abbreviation: string, rateValuesForPeriod: number[]): ICurrencyChartTitle {
		const trend = LineChartTitleService.getPeriodTrendInPercentage(rateValuesForPeriod);

		if (trend > 0) {
			return {
				text: `${abbreviation} \u2191 (+${trend} %)`,
				style: {
					color: HexColors.GREEN,
				},
			};
		}

		if (trend < 0) {
			return {
				text: `${abbreviation} \u2193 (${trend} %)`,
				style: {
					color: HexColors.RED,
				},
			};
		}

		return {
			text: abbreviation,
			style: {
				color: HexColors.BLACK,
			},
		};
	}

	private static getPeriodTrendInPercentage(allRates: number[]): number {
		if (_.isNil(allRates) || _.isEmpty(allRates)) {
			return 0;
		}

		const diffForThePeriod = _.last(allRates)! - _.first(allRates)!;

		return _.round((diffForThePeriod / _.first(allRates)!) * 100, RatesGridDefaultOptions.RATE_DIFF_PRECISION);
	}
}
