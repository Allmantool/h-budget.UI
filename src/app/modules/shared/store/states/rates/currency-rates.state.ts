import { Injectable } from '@angular/core';

import * as _ from 'lodash';

import { Action, State, StateContext } from '@ngxs/store';
import { format } from 'date-fns';
import { catchError, concatMap, finalize, map, Observable, of, shareReplay, take, tap, throwError } from 'rxjs';

import {
	AddCurrencyGroups,
	EnsurePersistedCurrencyRatesLoaded,
	FetchAllCurrencyRates,
	FetchTodayCurrencyRates,
	InitializeCurrencyRates,
} from './actions/currency.actions';
import { CurrencyChartState } from './currency-chart.state';
import { CurrencyTableState } from './currency-table.state';
import { ICurrencyRatesStateModel } from './models/currency-rates-state.model';
import { NationalBankCurrenciesProvider } from '../../../../../../data/providers/rates/national-bank-currencies.provider';
import { CurrencyRateValueModel } from '../../../../../../domain/models/rates/currency-rate-value.model';
import { CurrencyRateGroupModel } from '../../../../../../domain/models/rates/currency-rates-group.model';
import { DateFormats } from '../../../constants/date-formats';

@State<ICurrencyRatesStateModel>({
	name: 'currencyState',
	defaults: {
		rateGroups: [],
		hasLoadedPersistedRates: false,
		hasInitializedRates: false,
		isLoadingPersistedRates: false,
	},
	children: [CurrencyTableState, CurrencyChartState],
})
@Injectable()
export class CurrencyRatesState {
	private initializationRequest$?: Observable<void>;

	private persistedRatesRequest$?: Observable<void>;

	constructor(private readonly currencyRateProvider: NationalBankCurrenciesProvider) {}

	@Action(AddCurrencyGroups)
	addCurrencyGroups(
		{ getState, patchState }: StateContext<ICurrencyRatesStateModel>,
		{ addedRateGroups }: AddCurrencyGroups
	): void {
		patchState({
			rateGroups: this.mergeRateGroups(getState().rateGroups, addedRateGroups),
		});
	}

	@Action(FetchTodayCurrencyRates)
	fetchTodayCurrencyRates({ getState, patchState }: StateContext<ICurrencyRatesStateModel>) {
		return this.currencyRateProvider.getTodayCurrencies().pipe(
			take(1),
			tap(todayRateGroups => {
				const mappedTodayRateGroups = this.mapRateGroups(todayRateGroups);

				patchState({
					rateGroups: this.mergeRateGroups(getState().rateGroups, mappedTodayRateGroups),
				});
			})
		);
	}

	@Action(FetchAllCurrencyRates)
	fetchAllCurrencyRates(ctx: StateContext<ICurrencyRatesStateModel>) {
		return this.currencyRateProvider.getCurrencies().pipe(
			take(1),
			tap(currencyRateGroups =>
				ctx.patchState({
					rateGroups: this.mapRateGroups(currencyRateGroups),
					hasLoadedPersistedRates: true,
					isLoadingPersistedRates: false,
				})
			)
		);
	}

	@Action(InitializeCurrencyRates)
	initializeCurrencyRates(ctx: StateContext<ICurrencyRatesStateModel>): Observable<void> {
		if (ctx.getState().hasInitializedRates) {
			return of(undefined);
		}

		if (this.initializationRequest$) {
			return this.initializationRequest$;
		}

		const initializationRequest$ = ctx.dispatch(new EnsurePersistedCurrencyRatesLoaded()).pipe(
			concatMap(() => ctx.dispatch(new FetchTodayCurrencyRates())),
			tap(() => ctx.patchState({ hasInitializedRates: true })),
			map(() => undefined),
			finalize(() => {
				this.initializationRequest$ = undefined;
			}),
			shareReplay({ bufferSize: 1, refCount: false })
		);

		this.initializationRequest$ = initializationRequest$;

		return initializationRequest$;
	}

	@Action(EnsurePersistedCurrencyRatesLoaded)
	ensurePersistedCurrencyRatesLoaded(ctx: StateContext<ICurrencyRatesStateModel>): Observable<void> {
		const state = ctx.getState();

		if (state.hasLoadedPersistedRates) {
			return of(undefined);
		}

		if (this.persistedRatesRequest$) {
			return this.persistedRatesRequest$;
		}

		ctx.patchState({
			isLoadingPersistedRates: true,
		});

		const persistedRatesRequest$ = this.currencyRateProvider.getCurrencies().pipe(
			take(1),
			tap(currencyRateGroups =>
				ctx.patchState({
					rateGroups: this.mapRateGroups(currencyRateGroups),
					hasLoadedPersistedRates: true,
					isLoadingPersistedRates: false,
				})
			),
			map(() => undefined),
			catchError((error: unknown) => {
				ctx.patchState({
					isLoadingPersistedRates: false,
				});

				return throwError(() => error);
			}),
			finalize(() => {
				this.persistedRatesRequest$ = undefined;
			}),
			shareReplay({ bufferSize: 1, refCount: false })
		);

		this.persistedRatesRequest$ = persistedRatesRequest$;

		return persistedRatesRequest$;
	}

	private mergeRateGroups(
		existingRateGroups: CurrencyRateGroupModel[],
		incomingRateGroups: CurrencyRateGroupModel[]
	): CurrencyRateGroupModel[] {
		const groupsByCurrencyId = new Map<number, CurrencyRateGroupModel>(
			existingRateGroups.map(group => [this.getRequiredCurrencyId(group), this.cloneRateGroup(group)] as const)
		);

		for (const incomingGroup of incomingRateGroups) {
			const currencyId = this.getRequiredCurrencyId(incomingGroup);
			const existingGroup = groupsByCurrencyId.get(currencyId);

			if (!existingGroup) {
				groupsByCurrencyId.set(currencyId, this.cloneRateGroup(incomingGroup));

				continue;
			}

			groupsByCurrencyId.set(currencyId, {
				...existingGroup,
				...incomingGroup,
				rateValues: this.mergeRateValues(existingGroup.rateValues ?? [], incomingGroup.rateValues ?? []),
			});
		}

		return Array.from(groupsByCurrencyId.values());
	}

	private getRequiredCurrencyId(group: CurrencyRateGroupModel): number {
		const { currencyId } = group;

		if (currencyId === undefined) {
			throw new Error('Cannot add a currency-rate group without a currency identifier.');
		}

		return currencyId;
	}

	private orderRateValues(rateValues: CurrencyRateValueModel[]): CurrencyRateValueModel[] {
		return _.orderBy(rateValues, rate => this.getRateTimestamp(rate));
	}

	private mergeRateValues(
		existingRateValues: CurrencyRateValueModel[],
		incomingRateValues: CurrencyRateValueModel[]
	): CurrencyRateValueModel[] {
		const ratesByBusinessDate = new Map<string, CurrencyRateValueModel>();

		for (const rate of existingRateValues) {
			ratesByBusinessDate.set(this.getRateBusinessDate(rate), this.cloneRateValue(rate));
		}

		for (const rate of incomingRateValues) {
			// Incoming values are authoritative; repeated incoming dates use the final value.
			ratesByBusinessDate.set(this.getRateBusinessDate(rate), this.cloneRateValue(rate));
		}

		return this.orderRateValues(Array.from(ratesByBusinessDate.values()));
	}

	private getRateTimestamp(rate: CurrencyRateValueModel): number {
		const updateDate = rate.updateDate;

		if (updateDate instanceof Date) {
			return updateDate.getTime();
		}

		return Date.parse(String(updateDate));
	}

	private getRateBusinessDate(rate: CurrencyRateValueModel): string {
		const updateDate = rate.updateDate;

		if (!(updateDate instanceof Date) || Number.isNaN(updateDate.getTime())) {
			throw new Error('Cannot merge a currency rate without a valid update date.');
		}

		return format(updateDate, DateFormats.ApiRequest);
	}

	private cloneRateGroup(rateGroup: CurrencyRateGroupModel): CurrencyRateGroupModel {
		return {
			...rateGroup,
			rateValues: this.orderRateValues((rateGroup.rateValues ?? []).map(rate => this.cloneRateValue(rate))),
		};
	}

	private cloneRateValue(rate: CurrencyRateValueModel): CurrencyRateValueModel {
		return new CurrencyRateValueModel({
			officialRate: rate.officialRate,
			ratePerUnit: rate.ratePerUnit,
			updateDate: rate.updateDate ? new Date(rate.updateDate) : undefined,
		});
	}

	private mapRateGroups(currencyRateGroups: CurrencyRateGroupModel[]): CurrencyRateGroupModel[] {
		return currencyRateGroups.map(rateGroup => this.cloneRateGroup(rateGroup));
	}
}
