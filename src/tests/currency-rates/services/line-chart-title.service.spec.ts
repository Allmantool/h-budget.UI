import { HexColors } from '../../../app/modules/shared/constants/hex-colors';
import { RatesGridDefaultOptions } from '../../../app/modules/shared/constants/rates-grid-default-options';
import { LineChartTitleService } from '../../../presentation/currency-rates/services/line-chart-title.service';

describe('lIne chart title service', () => {
	it('should return default color if there are no rates"', (done: DoneFn) => {
		const rateValuesForPeriod: number[] = [];

		const title = LineChartTitleService.calculateTitle('test-abbreviation', rateValuesForPeriod);

		expect(title).toEqual({
			text: 'test-abbreviation',
			style: {
				color: HexColors.BLACK,
			},
		});

		done();
	});

	it('should return green color if there is growing trend"', (done: DoneFn) => {
		const rateValuesForPeriod: number[] = [1.254, 2.66];

		const title = LineChartTitleService.calculateTitle('test-abbreviation', rateValuesForPeriod);
		const expectedTrend = (((2.66 - 1.254) / 1.254) * 100).toFixed(RatesGridDefaultOptions.RATE_DIFF_PRECISION);

		expect(title.text).toContain('test-abbreviation');
		expect(title.text).toContain('↑');
		expect(title.text).toContain(`(+${expectedTrend} %)`);
		expect(title.style).toEqual({ color: HexColors.GREEN });

		done();
	});

	it('should return red color if there is falling trend"', (done: DoneFn) => {
		const rateValuesForPeriod: number[] = [6.78, 1.254, 2.66];

		const title = LineChartTitleService.calculateTitle('test-abbreviation', rateValuesForPeriod);
		const expectedTrend = (((2.66 - 6.78) / 6.78) * 100).toFixed(RatesGridDefaultOptions.RATE_DIFF_PRECISION);

		expect(title.text).toContain('test-abbreviation');
		expect(title.text).toContain('↓');
		expect(title.text).toContain(`(${expectedTrend} %)`);
		expect(title.style).toEqual({ color: HexColors.RED });
		done();
	});

	it('should return neutral title when the first and last values are equal"', (done: DoneFn) => {
		const rateValuesForPeriod: number[] = [2.5, 3.1, 2.5];

		const title = LineChartTitleService.calculateTitle('test-abbreviation', rateValuesForPeriod);

		expect(title).toEqual({
			text: 'test-abbreviation',
			style: {
				color: HexColors.BLACK,
			},
		});

		done();
	});
});
