/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { TestBed } from '@angular/core/testing';

import { Mapper, MapperModule } from '@dynamic-mapper/angular';
import { NgxsModule, Store } from '@ngxs/store';
import { of } from 'rxjs';

import { AppSharedModule } from '../../../app/modules/shared/shared.module';
import { CurrencyTrend } from '../../../app/modules/shared/store/models/currency-rates/currency-trend';
import { IPreviousDayCurrencyRate } from '../../../app/modules/shared/store/models/currency-rates/previous-day-currency-rate';
import { ngxsConfig } from '../../../app/modules/shared/store/ngxs.config';
import { CurrencyChartState } from '../../../app/modules/shared/store/states/rates/currency-chart.state';
import { CurrencyRatesState } from '../../../app/modules/shared/store/states/rates/currency-rates.state';
import { CurrencyTableState } from '../../../app/modules/shared/store/states/rates/currency-table.state';
import { ICurrencyRatesStateModel } from '../../../app/modules/shared/store/states/rates/models/currency-rates-state.model';
import { DataRatesMappingProfile } from '../../../data/providers/rates/mappers/data-rates-mapping.profiler';
import { NationalBankCurrenciesProvider } from '../../../data/providers/rates/national-bank-currencies.provider';
import { CurrencyRateValueModel } from '../../../domain/models/rates/currency-rate-value.model';
import { CurrencyRateGroupModel } from '../../../domain/models/rates/currency-rates-group.model';
import { PresentationRatesMappingProfile } from '../../../presentation/currency-rates/mappers/presentation-rates-mapping.profiler';
import { CurrencyRatesGridService } from '../../../presentation/currency-rates/services/currency-rates-grid.service';

describe('currency rates grid service', () => {
	let sut: CurrencyRatesGridService;

	let store: Store;
	let currencyRateProviderSpy: any;

	beforeEach(() => {
		currencyRateProviderSpy = jasmine.createSpyObj('currencyRatesProvider', {
			getTodayCurrencies: of<CurrencyRateGroupModel[]>([
				new CurrencyRateGroupModel({
					currencyId: 1,
					name: 'currency-a',
					abbreviation: 'cur-a',
					scale: 1,
					rateValues: [
						new CurrencyRateValueModel({
							officialRate: 1.11,
							ratePerUnit: 10,
							updateDate: new Date(2024, 0, 17),
						}),
					],
				}),
			]),
		});

		TestBed.configureTestingModule({
			imports: [
				NgxsModule.forRoot([CurrencyRatesState, CurrencyTableState, CurrencyChartState], ngxsConfig),
				MapperModule.withProfiles([DataRatesMappingProfile, PresentationRatesMappingProfile]),
				AppSharedModule,
			],
			providers: [
				Mapper,
				CurrencyRatesGridService,
				{
					provide: NationalBankCurrenciesProvider,
					useValue: currencyRateProviderSpy,
				},
			],
		});

		sut = TestBed.inject(CurrencyRatesGridService);
		store = TestBed.inject(Store);
	});

	it('should add expected trend information by "enrichWithTrend"', (done: DoneFn) => {
		const previousDayRates: IPreviousDayCurrencyRate[] = [
			{
				updateDate: new Date(2023, 11, 5),
				ratePerUnit: 1.34,
				currencyId: 101,
			},
			{
				updateDate: new Date(2024, 0, 30),
				ratePerUnit: 1.34,
				currencyId: 207,
			},
			{
				updateDate: new Date(2024, 1, 20),
				ratePerUnit: 1.34,
				currencyId: 312,
			},
		];

		const todayRateGroups: CurrencyRateGroupModel[] = [
			new CurrencyRateGroupModel({
				currencyId: 101,
				abbreviation: 'cur-a',
				scale: 10,
				name: 'cur-a-name-up',
				rateValues: [
					new CurrencyRateValueModel({
						officialRate: 15.5,
						ratePerUnit: 1.55,
						updateDate: new Date(2024, 1, 20),
					}),
				],
			}),
			new CurrencyRateGroupModel({
				currencyId: 207,
				abbreviation: 'cur-b',
				scale: 1,
				name: 'cur-b-name-down',
				rateValues: [
					new CurrencyRateValueModel({
						officialRate: 1.2,
						ratePerUnit: 1.2,
						updateDate: new Date(2024, 1, 20),
					}),
				],
			}),
			new CurrencyRateGroupModel({
				currencyId: 312,
				abbreviation: 'cur-c',
				scale: 1,
				name: 'cur-c-name-same',
				rateValues: [
					new CurrencyRateValueModel({
						officialRate: 1.34,
						ratePerUnit: 1.34,
						updateDate: new Date(2024, 1, 20),
					}),
				],
			}),
		];

		const result = sut.enrichWithTrend(previousDayRates, todayRateGroups);

		expect(result.filteredData.length).toBe(3);
		expect(result.filteredData.find(i => i.currencyId === 101)?.currencyTrend).toBe(CurrencyTrend.up);
		expect(result.filteredData.find(i => i.currencyId === 207)?.currencyTrend).toBe(CurrencyTrend.down);
		expect(result.filteredData.find(i => i.currencyId === 312)?.currencyTrend).toBe(CurrencyTrend.notChanged);
		done();
	});

	it('should add expected rate percentage differencies by "enrichWithTrend"', (done: DoneFn) => {
		const previousDayRates: IPreviousDayCurrencyRate[] = [
			{
				updateDate: new Date(2023, 11, 5),
				ratePerUnit: 1.34,
				currencyId: 101,
			},
			{
				updateDate: new Date(2024, 0, 30),
				ratePerUnit: 1.34,
				currencyId: 207,
			},
			{
				updateDate: new Date(2024, 1, 20),
				ratePerUnit: 1.34,
				currencyId: 312,
			},
		];

		const todayRateGroups: CurrencyRateGroupModel[] = [
			new CurrencyRateGroupModel({
				currencyId: 101,
				abbreviation: 'cur-a',
				scale: 10,
				name: 'cur-a-name-up',
				rateValues: [
					new CurrencyRateValueModel({
						officialRate: 15.5,
						ratePerUnit: 1.55,
						updateDate: new Date(2024, 1, 20),
					}),
				],
			}),
			new CurrencyRateGroupModel({
				currencyId: 207,
				abbreviation: 'cur-b',
				scale: 1,
				name: 'cur-b-name-down',
				rateValues: [
					new CurrencyRateValueModel({
						officialRate: 1.2,
						ratePerUnit: 1.2,
						updateDate: new Date(2024, 1, 20),
					}),
				],
			}),
			new CurrencyRateGroupModel({
				currencyId: 312,
				abbreviation: 'cur-c',
				scale: 1,
				name: 'cur-c-name-same',
				rateValues: [
					new CurrencyRateValueModel({
						officialRate: 1.34,
						ratePerUnit: 1.34,
						updateDate: new Date(2024, 1, 20),
					}),
				],
			}),
		];

		const result = sut.enrichWithTrend(previousDayRates, todayRateGroups);

		expect(result.filteredData.find(i => i.currencyId === 101)?.rateDiff).toBe('15.67');
		expect(result.filteredData.find(i => i.currencyId === 207)?.rateDiff).toBe('-10.45');
		expect(result.filteredData.find(i => i.currencyId === 312)?.rateDiff).toBe('0');

		done();
	});

	it('should put today rates to store during "getTodayCurrenciesAsync"', async () => {
		await sut.getTodayCurrenciesAsync();

		const currencyRatesState: ICurrencyRatesStateModel = store.selectSnapshot(state => state.currencyState);

		expect(currencyRatesState.rateGroups.length).toBe(1);
	});

	it('should return valid grid table selection by "GetTableSelection"', (done: DoneFn) => {
		const todayRateGroups: CurrencyRateGroupModel[] = [
			new CurrencyRateGroupModel({
				currencyId: 101,
				abbreviation: 'cur-a',
				scale: 10,
				name: 'cur-a-name-up',
				rateValues: [
					new CurrencyRateValueModel({
						officialRate: 15.5,
						ratePerUnit: 1.55,
						updateDate: new Date(2024, 1, 20),
					}),
				],
			}),
			new CurrencyRateGroupModel({
				currencyId: 207,
				abbreviation: 'cur-b',
				scale: 1,
				name: 'cur-b-name-down',
				rateValues: [
					new CurrencyRateValueModel({
						officialRate: 1.2,
						ratePerUnit: 1.2,
						updateDate: new Date(2024, 1, 20),
					}),
				],
			}),
		];

		const tableSelectionResult = sut.GetTableSelection(todayRateGroups, 207);
		const payload = tableSelectionResult.selected;

		expect(payload.length).toBe(1);
		expect(payload[0].name).toBe('cur-b-name-down');

		done();
	});

	it('should return expected table source by "GetDataSource"', (done: DoneFn) => {
		const todayRateGroups: CurrencyRateGroupModel[] = [
			new CurrencyRateGroupModel({
				currencyId: 101,
				abbreviation: 'cur-a',
				scale: 10,
				name: 'cur-a-name-up',
				rateValues: [
					new CurrencyRateValueModel({
						officialRate: 15.5,
						ratePerUnit: 1.55,
						updateDate: new Date(2024, 1, 20),
					}),
				],
			}),
			new CurrencyRateGroupModel({
				currencyId: 207,
				abbreviation: 'cur-b',
				scale: 1,
				name: 'cur-b-name-down',
				rateValues: [
					new CurrencyRateValueModel({
						officialRate: 1.2,
						ratePerUnit: 1.2,
						updateDate: new Date(2024, 1, 20),
					}),
				],
			}),
		];

		const tableSelectionResult = sut.GetDataSource(todayRateGroups);
		const payload = tableSelectionResult.data;

		expect(payload.length).toBe(2);

		done();
	});
});
