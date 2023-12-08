import { HexColors } from '../../../app/modules/shared/constants/hex-colors';
import { LineChartTitleService } from '../../../presentation/currency-rates/services/line-chart-title.service';
describe('LIne chart title service', () => {
	it('Should return default color if there are no rates"', (done: DoneFn) => {
		const rateValuesForPeriod: number[] = [];

		const title = LineChartTitleService.calculateTitle('test-abbreviation', rateValuesForPeriod);

		expect(JSON.stringify(title.style)).toBe(`{"color":"${HexColors.BLACK}"}`);

		done();
	});

	it('Should return green color if there is growing trend"', (done: DoneFn) => {
		const rateValuesForPeriod: number[] = [1.254, 2.66];

		const title = LineChartTitleService.calculateTitle('test-abbreviation', rateValuesForPeriod);

		expect(JSON.stringify(title.style)).toBe(`{"color":"${HexColors.GREEN}"}`);

		done();
	});

	it('Should return green color if there is growing trend"', (done: DoneFn) => {
		const rateValuesForPeriod: number[] = [6.78, 1.254, 2.66];

		const title = LineChartTitleService.calculateTitle('test-abbreviation', rateValuesForPeriod);

		expect(JSON.stringify(title.style)).toBe(`{"color":"${HexColors.RED}"}`);

		done();
	});
});
