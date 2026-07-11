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
import { of, Subject, throwError } from 'rxjs';

import { ngxsConfig } from './../../../../app/modules/shared/store/ngxs.config';
import {
	AddCurrencyGroups,
	EnsurePersistedCurrencyRatesLoaded,
	FetchAllCurrencyRates,
} from '../../../../app/modules/shared/store/states/rates/actions/currency.actions';
import { CurrencyChartState } from '../../../../app/modules/shared/store/states/rates/currency-chart.state';
import { CurrencyRatesState } from '../../../../app/modules/shared/store/states/rates/currency-rates.state';
import { ICurrencyRatesStateModel } from '../../../../app/modules/shared/store/states/rates/models/currency-rates-state.model';
import {
	getCurrencyRatesFromPreviousDay,
	getCurrencyRatesGroupByCurrencyId,
} from '../../../../app/modules/shared/store/states/rates/selectors/currency.selectors';
import { NationalBankCurrenciesProvider } from '../../../../data/providers/rates/national-bank-currencies.provider';
import { CurrencyRateValueModel } from '../../../../domain/models/rates/currency-rate-value.model';
import { CurrencyRateGroupModel } from '../../../../domain/models/rates/currency-rates-group.model';

describe('currency rates store', () => {
	let store: Store;
	let currencyRateProviderSpy: jasmine.SpyObj<NationalBankCurrenciesProvider>;

	function createInitialStoreRateGroups(): CurrencyRateGroupModel[] {
		return [
			new CurrencyRateGroupModel({
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
			}),
			new CurrencyRateGroupModel({
				currencyId: 2,
				rateValues: [
					new CurrencyRateValueModel({
						ratePerUnit: 12,
						updateDate: new Date(2022, 4, 4),
					}),
				],
			}),
		];
	}

	beforeEach(() => {
		currencyRateProviderSpy = jasmine.createSpyObj<NationalBankCurrenciesProvider>('currencyRateProvider', [
			'getCurrencies',
		]);

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

		store.dispatch(new AddCurrencyGroups(createInitialStoreRateGroups()));
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

				expect(updatedRate?.ratePerUnit).toBe(17);
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

				expect(items.length).toBe(4);
			});
	});

	it('it "AddCurrencyGroups": replaces same-day rates without mutating state or action payloads', () => {
		const previousState = store.selectSnapshot(
			(state: { currencyState: ICurrencyRatesStateModel }) => state.currencyState.rateGroups
		);
		const incomingRateGroups = [
			new CurrencyRateGroupModel({
				currencyId: 1,
				rateValues: [
					new CurrencyRateValueModel({
						ratePerUnit: 17,
						updateDate: new Date(2022, 1, 3, 18),
					}),
					new CurrencyRateValueModel({
						ratePerUnit: 8,
						updateDate: new Date(2022, 2, 3),
					}),
				],
			}),
		];

		store.dispatch(new AddCurrencyGroups(incomingRateGroups));

		const mergedRateGroup = store
			.selectSnapshot((state: { currencyState: ICurrencyRatesStateModel }) => state.currencyState.rateGroups)
			.find((group: CurrencyRateGroupModel) => group.currencyId === 1);

		expect(mergedRateGroup?.rateValues?.map((rate: CurrencyRateValueModel) => rate.ratePerUnit)).toEqual([
			17, 16, 8,
		]);
		expect(previousState[0].rateValues?.map((rate: CurrencyRateValueModel) => rate.ratePerUnit)).toEqual([14, 16]);
		expect(incomingRateGroups[0].rateValues?.map(rate => rate.ratePerUnit)).toEqual([17, 8]);
	});

	it('it "AddCurrencyGroups": uses the final incoming rate for duplicate currency-date identities', () => {
		const incomingRateGroups = [
			new CurrencyRateGroupModel({
				currencyId: 1,
				rateValues: [new CurrencyRateValueModel({ ratePerUnit: 17, updateDate: new Date(2022, 1, 3) })],
			}),
			new CurrencyRateGroupModel({
				currencyId: 1,
				rateValues: [new CurrencyRateValueModel({ ratePerUnit: 18, updateDate: new Date(2022, 1, 3, 18) })],
			}),
		];

		store.dispatch(new AddCurrencyGroups(incomingRateGroups));

		const rateValues = store
			.selectSnapshot((state: { currencyState: ICurrencyRatesStateModel }) => state.currencyState.rateGroups)
			.find((group: CurrencyRateGroupModel) => group.currencyId === 1)?.rateValues;

		expect(rateValues?.length).toBe(2);
		expect(rateValues?.find((rate: CurrencyRateValueModel) => rate.updateDate?.getDate() === 3)?.ratePerUnit).toBe(
			18
		);
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
		const snapshot = store.snapshot();

		store.reset({
			...snapshot,
			currencyState: {
				...snapshot.currencyState,
				hasLoadedPersistedRates: true,
			},
		});
		currencyRateProviderSpy.getCurrencies.and.returnValue(of([]));

		store.dispatch(new EnsurePersistedCurrencyRatesLoaded());

		const groups = store.selectSnapshot(state => state.currencyState.rateGroups);

		expect(currencyRateProviderSpy.getCurrencies.calls.any()).toBeFalse();
		expect(groups.length).toBe(2);
	});

	it('it "EnsurePersistedCurrencyRatesLoaded": shares an in-flight request and completes its lifecycle', () => {
		const snapshot = store.snapshot();
		const persistedRatesSubject = new Subject<CurrencyRateGroupModel[]>();

		store.reset({
			...snapshot,
			currencyState: {
				...snapshot.currencyState,
				rateGroups: [],
				hasLoadedPersistedRates: false,
				isLoadingPersistedRates: false,
			},
		});
		currencyRateProviderSpy.getCurrencies.and.returnValue(persistedRatesSubject);

		store.dispatch(new EnsurePersistedCurrencyRatesLoaded());
		store.dispatch(new EnsurePersistedCurrencyRatesLoaded());

		expect(currencyRateProviderSpy.getCurrencies.calls.count()).toBe(1);
		expect(store.selectSnapshot(state => state.currencyState.isLoadingPersistedRates)).toBeTrue();

		persistedRatesSubject.next(createInitialStoreRateGroups());
		persistedRatesSubject.complete();

		const currencyState = store.selectSnapshot(state => state.currencyState);

		expect(currencyState.hasLoadedPersistedRates).toBeTrue();
		expect(currencyState.isLoadingPersistedRates).toBeFalse();
		expect(currencyState.rateGroups.length).toBe(2);
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

	it('it "EnsurePersistedCurrencyRatesLoaded": allows retry after a failed load', () => {
		const snapshot = store.snapshot();

		store.reset({
			...snapshot,
			currencyState: {
				...snapshot.currencyState,
				rateGroups: [],
				hasLoadedPersistedRates: false,
				isLoadingPersistedRates: false,
			},
		});
		currencyRateProviderSpy.getCurrencies.and.returnValues(
			throwError(() => new Error('load failed')),
			of([])
		);

		store.dispatch(new EnsurePersistedCurrencyRatesLoaded()).subscribe({ error: () => undefined });
		store.dispatch(new EnsurePersistedCurrencyRatesLoaded());

		const currencyState = store.selectSnapshot(state => state.currencyState);

		expect(currencyRateProviderSpy.getCurrencies.calls.count()).toBe(2);
		expect(currencyState.hasLoadedPersistedRates).toBeTrue();
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
			store.selectSnapshot((state: { currencyState: ICurrencyRatesStateModel }) => state.currencyState)
		)(2);

		expect(currencyGroup.currencyId).toBe(2);
	});
});
