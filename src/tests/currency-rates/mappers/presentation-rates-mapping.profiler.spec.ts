import { getTestBed, TestBed } from '@angular/core/testing';

import _ from 'lodash';

import { Mapper, MapperModule } from '@dynamic-mapper/angular';

import { CurrencyTrend } from '../../../app/modules/shared/store/models/currency-rates/currency-trend';
import { CurrencyRateValueModel } from '../../../domain/models/rates/currency-rate-value.model';
import { CurrencyRateGroupModel } from '../../../domain/models/rates/currency-rates-group.model';
import { PresentationRatesMappingProfile } from '../../../presentation/currency-rates/mappers/presentation-rates-mapping.profiler';
import { CurrencyGridRateModel } from '../../../presentation/currency-rates/models/currency-grid-rate.model';

describe('presentation rates mappings', () => {
	let mapper: Mapper;

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [MapperModule.withProfiles([PresentationRatesMappingProfile])],
			providers: [Mapper],
		});

		mapper = getTestBed().inject(Mapper);
	});

	it('should corretly map with "CurrencyRateGroupModelToGridRates" mapping pair', () => {
		const rateValues: CurrencyRateValueModel[] = [
			new CurrencyRateValueModel({
				officialRate: 22.24,
				ratePerUnit: 11.12,
				updateDate: new Date(2024, 1, 10),
			}),
			new CurrencyRateValueModel({
				officialRate: 22.24,
				ratePerUnit: 22.23,
				updateDate: new Date(2024, 2, 10),
			}),
		];

		const todayRateGroups: CurrencyRateGroupModel[] = [
			new CurrencyRateGroupModel({
				currencyId: 1,
				name: 'name-test',
				abbreviation: 'abbr-test',
				scale: 1,
				rateValues: rateValues,
			}),
		];

		const gridRates: CurrencyGridRateModel[] = mapper.map(
			PresentationRatesMappingProfile.CurrencyRateGroupModelToGridRates,
			todayRateGroups
		);

		expect(gridRates.length).toBe(1);

		const gridRate: CurrencyGridRateModel = _.first(gridRates)!;

		expect(gridRate.abbreviation).toBe('abbr-test');
		expect(gridRate.currencyId).toBe(1);
		expect(gridRate.currencyTrend).toBe(CurrencyTrend.notChanged);
		expect(gridRate.name).toBe('name-test');
		expect(gridRate.officialRate).toBe(22.24);
		expect(gridRate.rateDiff).toBe('0');
		expect(gridRate.ratePerUnit).toBe(11.12);
		expect(gridRate.scale).toBe(1);
		expect(gridRate.updateDate).toEqual(new Date(2024, 1, 10));
	});
});
