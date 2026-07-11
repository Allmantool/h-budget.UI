/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { TestBed } from '@angular/core/testing';
import { CurrencyTableState } from 'app/modules/shared/store/states/rates/currency-table.state';

import * as _ from 'lodash';

import { NgxsModule, Store } from '@ngxs/store';
import { of, throwError } from 'rxjs';

import { ngxsConfig } from './../../../../app/modules/shared/store/ngxs.config';
import {
	AddCurrencyGroups,
	EnsurePersistedCurrencyRatesLoaded,
	FetchAllCurrencyRates,
} from '../../../../app/modules/shared/store/states/rates/actions/currency.actions';
import { CurrencyChartState } from '../../../../app/modules/shared/store/states/rates/currency-chart.state';
import { CurrencyRatesState } from '../../../../app/modules/shared/store/states/rates/currency-rates.state';
import {
	getCurrencyRatesFromPreviousDay,
	getCurrencyRatesGroupByCurrencyId,
} from '../../../../app/modules/shared/store/states/rates/selectors/currency.selectors';
import { NationalBankCurrenciesProvider } from '../../../../data/providers/rates/national-bank-currencies.provider';
import { CurrencyRateValueModel } from '../../../../domain/models/rates/currency-rate-value.model';
import { CurrencyRateGroupModel } from '../../../../domain/models/rates/currency-rates-group.model';

describe('currency rates store', () => {
	let store: Store;
	let currencyRateProviderSpy: any;

	const initialStoreRateGroups: CurrencyRateGroupModel[] = new Array<CurrencyRateGroupModel>(
		{
			currencyId: 1,
			rateValues: [
				new CurrencyRateValueModel({
					ratePerUnit: 14,
					updateDate: new Date(2022, 1, 3),
				}),
				new CurrencyRateValueModel({
					ratePerUnit: 16,
					updateDate: new Date(2022, 1, 4),
				}),
			],
		},
		{
			currencyId: 2,
			rateValues: [
				new CurrencyRateValueModel({
					ratePerUnit: 12,
					updateDate: new Date(2022, 4, 4),
				}),
			],
		} as CurrencyRateGroupModel
	);

	beforeEach(() => {
		currencyRateProviderSpy = jasmine.createSpyObj('currencyRateProvider', ['getCurrencies']);

		TestBed.configureTestingModule({
			imports: [NgxsModule.forRoot([CurrencyRatesState, CurrencyTableState, CurrencyChartState], ngxsConfig)],
			providers: [
				{
					provide: NationalBankCurrenciesProvider,
					useValue: currencyRateProviderSpy,
				},
			],
		}).compileComponents();

		store = TestBed.inject(Store);

		store.dispatch(new AddCurrencyGroups(initialStoreRateGroups));
	});

	it('it "AddCurrencyGroups": initial setup - expect 2 currency groups', () => {
		store
			.selectOnce(state => state.currencyState.rateGroups)
			.subscribe(groups => {
				expect(groups.length).toBe(2);
			});
	});

	it('it "AddCurrencyGroups": update existed currency groups - expect still 2 currency groups', () => {
		const updatedCurrencyRateGroups = new Array({
			currencyId: 1,
			rateValues: [
				new CurrencyRateValueModel({
					ratePerUnit: 17,
					updateDate: new Date(2022, 1, 3),
				}),
				new CurrencyRateValueModel({
					ratePerUnit: 8,
					updateDate: new Date(2022, 2, 3),
				}),
			],
		} as CurrencyRateGroupModel);

		store.dispatch(new AddCurrencyGroups(updatedCurrencyRateGroups));

		store
			.selectOnce(state => state.currencyState.rateGroups)
			.subscribe(groups => {
				expect(groups.length).toBe(2);
			});
	});

	it('it "AddCurrencyGroups": update existed currency groups - expect update currency with same date', () => {
		const updatedCurrencyRateGroups = new Array({
			currencyId: 1,
			rateValues: [
				new CurrencyRateValueModel({
					ratePerUnit: 17,
					updateDate: new Date(2022, 1, 3),
				}),
				new CurrencyRateValueModel({
					ratePerUnit: 8,
					updateDate: new Date(2022, 2, 3),
				}),
			],
		} as CurrencyRateGroupModel);

		store.dispatch(new AddCurrencyGroups(updatedCurrencyRateGroups));

		store
			.selectOnce(state => state.currencyState.rateGroups)
			.subscribe(groups => {
				const updatedRateGroup = _.find(groups, g => g.currencyId === 1);
				const updatedRate = _.find(
					updatedRateGroup.rateValues,
					r => r.updateDate.toDateString() === new Date(2022, 1, 3).toDateString()
				);

				expect(updatedRate?.ratePerUnit).toBe(14);
			});
	});

	it('it "AddRange": update existed currency groups - expect predicte amount of rates within groups', () => {
		const updatedCurrencyRateGroups = new Array({
			currencyId: 1,
			rateValues: [
				new CurrencyRateValueModel({
					ratePerUnit: 17,
					updateDate: new Date(2022, 1, 3),
				}),
				new CurrencyRateValueModel({
					ratePerUnit: 8,
					updateDate: new Date(2022, 2, 3),
				}),
			],
		} as CurrencyRateGroupModel);

		store.dispatch(new AddCurrencyGroups(updatedCurrencyRateGroups));

		store
			.selectOnce(state => state.currencyState.rateGroups)
			.subscribe((groups: CurrencyRateGroupModel[]) => {
				const items = _.flattenDeep(_.map(groups, g => g.rateValues!));

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
					updateDate: new Date(2022, 1, 3),
				} as CurrencyRateValueModel,
				{
					ratePerUnit: 16,
					updateDate: new Date(2022, 1, 4),
				} as CurrencyRateValueModel,
			],
		});

		currencyRateProviderSpy.getCurrencies.and.returnValue(of(stubValue));
		store.dispatch(new FetchAllCurrencyRates());

		const groups = store.selectSnapshot(state => state.currencyState.rateGroups);

		const items = _.flattenDeep(_.map(groups, (g: CurrencyRateGroupModel) => g.rateValues!));

		expect(items.length).toBe(2);
	});

	it('it "EnsurePersistedCurrencyRatesLoaded": loads persisted rates into an empty state once', () => {
		const snapshot = store.snapshot();
		const stubValue = new Array<CurrencyRateGroupModel>({
			currencyId: 1,
			abbreviation: 'Val-A',
			name: 'test-name',
			scale: 2,
			rateValues: [
				{
					ratePerUnit: 16,
					updateDate: new Date(2022, 1, 4),
				} as CurrencyRateValueModel,
				{
					ratePerUnit: 14,
					updateDate: new Date(2022, 1, 3),
				} as CurrencyRateValueModel,
			],
		});

		store.reset({
			...snapshot,
			currencyState: {
				...snapshot.currencyState,
				rateGroups: [],
				hasLoadedPersistedRates: false,
				isLoadingPersistedRates: false,
			},
		});
		currencyRateProviderSpy.getCurrencies.and.returnValue(of(stubValue));

		store.dispatch(new EnsurePersistedCurrencyRatesLoaded());
		store.dispatch(new EnsurePersistedCurrencyRatesLoaded());

		const currencyState = store.selectSnapshot(state => state.currencyState);

		expect(currencyRateProviderSpy.getCurrencies.calls.count()).toBe(1);
		expect(currencyState.hasLoadedPersistedRates).toBeTrue();
		expect(currencyState.isLoadingPersistedRates).toBeFalse();
		expect(currencyState.rateGroups[0].rateValues.map((rate: CurrencyRateValueModel) => rate.ratePerUnit)).toEqual([
			14, 16,
		]);
	});

	it('it "EnsurePersistedCurrencyRatesLoaded": does not overwrite already loaded user state', () => {
		currencyRateProviderSpy.getCurrencies.and.returnValue(of([]));

		store.dispatch(new EnsurePersistedCurrencyRatesLoaded());

		const groups = store.selectSnapshot(state => state.currencyState.rateGroups);

		expect(currencyRateProviderSpy.getCurrencies.calls.any()).toBeFalse();
		expect(groups.length).toBe(2);
	});

	it('it "EnsurePersistedCurrencyRatesLoaded": resets loading state after provider errors', () => {
		const snapshot = store.snapshot();
		let hasError = false;

		store.reset({
			...snapshot,
			currencyState: {
				...snapshot.currencyState,
				rateGroups: [],
				hasLoadedPersistedRates: false,
				isLoadingPersistedRates: false,
			},
		});
		currencyRateProviderSpy.getCurrencies.and.returnValue(throwError(() => new Error('load failed')));

		store.dispatch(new EnsurePersistedCurrencyRatesLoaded()).subscribe({
			error: () => {
				hasError = true;
			},
		});

		const currencyState = store.selectSnapshot(state => state.currencyState);

		expect(hasError).toBeTrue();
		expect(currencyState.hasLoadedPersistedRates).toBeFalse();
		expect(currencyState.isLoadingPersistedRates).toBeFalse();
		expect(currencyState.rateGroups).toEqual([]);
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
						updateDate: new Date(2022, 1, 1),
					} as CurrencyRateValueModel,
					{
						ratePerUnit: 16,
						updateDate: new Date(2022, 1, 2),
					} as CurrencyRateValueModel,
					{
						ratePerUnit: 16,
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
		const currencyGroup = getCurrencyRatesGroupByCurrencyId(
			store.selectSnapshot((state: any) => state.currencyState)
		)(2);

		expect(currencyGroup.currencyId).toBe(2);
	});
});
