/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { TestBed } from '@angular/core/testing';

import { NgxsModule, Store } from '@ngxs/store';
import * as _ from 'lodash';
import { of } from 'rxjs';

import { CurrencyTrend } from './../../../../app/modules/shared/store/models/currency-rates/currency-trend';
import { ngxsConfig } from './../../../../app/modules/shared/store/ngxs.config';
import { CurrencyRatesState } from '../../../../app/modules/shared/store/states/rates/currency-rates.state';
import { NationalBankCurrencyProvider } from '../../../../data/providers/rates/national-bank-currency.provider';
import { CurrencyRateGroupModel } from 'domain/models/rates/currency-rates-group.model';
import { CurrencyRateValueModel } from 'domain/models/rates/currency-rate-value.model';
import {
	AddCurrencyGroups,
	FetchAllCurrencyRates,
} from '../../../../app/modules/shared/store/states/rates/actions/currency.actions';
import { CurrencyTableState } from 'app/modules/shared/store/states/rates/currency-table.state';
import { CurrencyChartState } from '../../../../app/modules/shared/store/states/rates/currency-chart.state';
import {
	getCurrencyRatesFromPreviousDay,
	getCurrencyRatesGroupByCurrencyId,
} from '../../../../app/modules/shared/store/states/rates/selectors/currency.selectors';

describe('Currency rates store', () => {
	let store: Store;
	let currencyRateProviderSpy: any;

	const initialStoreRateGroups: CurrencyRateGroupModel[] =
		new Array<CurrencyRateGroupModel>(
			{
				currencyId: 1,
				rateValues: [
					{
						ratePerUnit: 14,
						currencyTrend: CurrencyTrend.notChanged,
						updateDate: new Date(2022, 1, 3),
					} as CurrencyRateValueModel,
					{
						ratePerUnit: 16,
						currencyTrend: CurrencyTrend.notChanged,
						updateDate: new Date(2022, 1, 4),
					} as CurrencyRateValueModel,
				],
			} as CurrencyRateGroupModel,
			{
				currencyId: 2,
				rateValues: [
					{
						ratePerUnit: 12,
						currencyTrend: CurrencyTrend.up,
						updateDate: new Date(2022, 4, 4),
					} as CurrencyRateValueModel,
				],
			} as CurrencyRateGroupModel
		);

	beforeEach(() => {
		currencyRateProviderSpy = jasmine.createSpyObj('currencyRateProvider', [
			'getCurrencies',
		]);

		TestBed.configureTestingModule({
			imports: [
				NgxsModule.forRoot(
					[
						CurrencyRatesState,
						CurrencyTableState,
						CurrencyChartState,
					],
					ngxsConfig
				),
			],
			providers: [
				{
					provide: NationalBankCurrencyProvider,
					useValue: currencyRateProviderSpy,
				},
			],
		}).compileComponents();

		store = TestBed.inject(Store);

		store.dispatch(new AddCurrencyGroups(initialStoreRateGroups));
	});

	it('it "AddCurrencyGroups": initial setup - expect 2 carrency groups', () => {
		store
			.selectOnce((state) => state.currencyState.rateGroups)
			.subscribe((groups) => {
				expect(groups.length).toBe(2);
			});
	});

	it('it "AddCurrencyGroups": update existed currency groups - expect still 2 carrency groups', () => {
		const updatedCurrencyRateGroups = new Array({
			currencyId: 1,
			rateValues: [
				{
					ratePerUnit: 17,
					currencyTrend: CurrencyTrend.up,
					updateDate: new Date(2022, 1, 3),
				} as CurrencyRateValueModel,
				{
					ratePerUnit: 8,
					currencyTrend: CurrencyTrend.up,
					updateDate: new Date(2022, 2, 3),
				} as CurrencyRateValueModel,
			],
		} as CurrencyRateGroupModel);

		store.dispatch(new AddCurrencyGroups(updatedCurrencyRateGroups));

		store
			.selectOnce((state) => state.currencyState.rateGroups)
			.subscribe((groups) => {
				expect(groups.length).toBe(2);
			});
	});

	it('it "AddCurrencyGroups": update existed currency groups - expect update currency with same date', () => {
		const updatedCurrencyRateGroups = new Array({
			currencyId: 1,
			rateValues: [
				{
					ratePerUnit: 17,
					currencyTrend: CurrencyTrend.up,
					updateDate: new Date(2022, 1, 3),
				} as CurrencyRateValueModel,
				{
					ratePerUnit: 8,
					currencyTrend: CurrencyTrend.up,
					updateDate: new Date(2022, 2, 3),
				} as CurrencyRateValueModel,
			],
		} as CurrencyRateGroupModel);

		store.dispatch(new AddCurrencyGroups(updatedCurrencyRateGroups));

		store
			.selectOnce((state) => state.currencyState.rateGroups)
			.subscribe((groups) => {
				const updatedRateGroup = _.find(
					groups,
					(g) => g.currencyId == 1
				);
				const updatedRate = _.find(
					updatedRateGroup.rateValues,
					(r) =>
						r.updateDate.toDateString() ===
						new Date(2022, 1, 3).toDateString()
				);

				expect(updatedRate?.ratePerUnit).toBe(14);
			});
	});

	it('it "AddRange": update existed currency groups - expect predicte amount of rates within groups', () => {
		const updatedCurrencyRateGroups = new Array({
			currencyId: 1,
			rateValues: [
				{
					ratePerUnit: 17,
					currencyTrend: CurrencyTrend.up,
					updateDate: new Date(2022, 1, 3),
				} as CurrencyRateValueModel,
				{
					ratePerUnit: 8,
					currencyTrend: CurrencyTrend.up,
					updateDate: new Date(2022, 2, 3),
				} as CurrencyRateValueModel,
			],
		} as CurrencyRateGroupModel);

		store.dispatch(new AddCurrencyGroups(updatedCurrencyRateGroups));

		store
			.selectOnce((state) => state.currencyState.rateGroups)
			.subscribe((groups: CurrencyRateGroupModel[]) => {
				const items = _.flattenDeep(
					_.map(groups, (g) => g.rateValues!)
				);

				expect(items.length).toBe(5);
			});
	});

	it('it "FetchAllCurrencyRates": update existed currency groups - expect predicte amount of rates within groups', () => {
		const stubValue = new Array<CurrencyRateGroupModel>({
			currencyId: 1,
			abbreviation: 'Val-A',
			name: 'test-name',
			scale: 2,
			rateValues: [
				{
					ratePerUnit: 14,
					currencyTrend: CurrencyTrend.notChanged,
					updateDate: new Date(2022, 1, 3),
				} as CurrencyRateValueModel,
				{
					ratePerUnit: 16,
					currencyTrend: CurrencyTrend.notChanged,
					updateDate: new Date(2022, 1, 4),
				} as CurrencyRateValueModel,
			],
		});

		currencyRateProviderSpy.getCurrencies.and.returnValue(of(stubValue));
		store.dispatch(new FetchAllCurrencyRates());

		const groups = store.selectSnapshot(
			(state) => state.currencyState.rateGroups
		);

		const items = _.flattenDeep(
			_.map(groups, (g: CurrencyRateGroupModel) => g.rateValues!)
		);

		expect(items.length).toBe(2);
	});

	it('it "GetCurrencyRatesFromPreviousDay": return expected previous date currency rates', () => {
		const stubValue: CurrencyRateGroupModel[] = [
			{
				currencyId: 1,
				abbreviation: 'abbreviaion-1',
				name: 'name-1',
				scale: 100,
				rateValues: [
					{
						ratePerUnit: 14,
						currencyTrend: CurrencyTrend.notChanged,
						updateDate: new Date(2022, 1, 1),
					} as CurrencyRateValueModel,
					{
						ratePerUnit: 16,
						currencyTrend: CurrencyTrend.notChanged,
						updateDate: new Date(2022, 1, 2),
					} as CurrencyRateValueModel,
					{
						ratePerUnit: 16,
						currencyTrend: CurrencyTrend.notChanged,
						updateDate: new Date(2022, 1, 4),
					} as CurrencyRateValueModel,
				],
			},
		];

		const previousDayRates = getCurrencyRatesFromPreviousDay(stubValue);

		const previousDate = _.first(previousDayRates)?.updateDate;

		expect(previousDate?.getDate()).toBe(2);
	});

	it('it "GetCurrencyRatesByCurrencyId": return a currency group by id', () => {
		const carrencyGroup = getCurrencyRatesGroupByCurrencyId(
			store.selectSnapshot((state: any) => state.currencyState)
		)(2);

		expect(carrencyGroup.currencyId).toBe(2);
	});
});
