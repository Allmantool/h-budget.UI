import { Injectable } from '@angular/core';

import * as _ from 'lodash';

import { Action, State, StateContext } from '@ngxs/store';
import { catchError, EMPTY, take, tap, throwError } from 'rxjs';

import {
	AddCurrencyGroups,
	EnsurePersistedCurrencyRatesLoaded,
	FetchAllCurrencyRates,
	FetchTodayCurrencyRates,
} from './actions/currency.actions';
import { CurrencyChartState } from './currency-chart.state';
import { CurrencyTableState } from './currency-table.state';
import { ICurrencyRatesStateModel } from './models/currency-rates-state.model';
import { NationalBankCurrenciesProvider } from '../../../../../../data/providers/rates/national-bank-currencies.provider';
import { CurrencyRateValueModel } from '../../../../../../domain/models/rates/currency-rate-value.model';
import { CurrencyRateGroupModel } from '../../../../../../domain/models/rates/currency-rates-group.model';

@State<ICurrencyRatesStateModel>({
	name: 'currencyState',
	defaults: {
		rateGroups: [],
		hasLoadedPersistedRates: false,
		isLoadingPersistedRates: false,
	},
	children: [CurrencyTableState, CurrencyChartState],
})
@Injectable()
export class CurrencyRatesState {
	constructor(private readonly currencyRateProvider: NationalBankCurrenciesProvider) { }

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
	fetchTodayCurrencyRates({
		getState,
		patchState,
	}: StateContext<ICurrencyRatesStateModel>) {
		return this.currencyRateProvider.getTodayCurrencies().pipe(
			take(1),
			tap(todayRateGroups => {
				const mappedTodayRateGroups = this.mapRateGroups(todayRateGroups);

				patchState({
					rateGroups: this.mergeRateGroups(
						getState().rateGroups,
						mappedTodayRateGroups
					),
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

	@Action(EnsurePersistedCurrencyRatesLoaded)
	ensurePersistedCurrencyRatesLoaded(ctx: StateContext<ICurrencyRatesStateModel>) {
		const state = ctx.getState();

		if (state.hasLoadedPersistedRates || state.isLoadingPersistedRates) {
			return EMPTY;
		}

		ctx.patchState({
			isLoadingPersistedRates: true,
		});

		return this.currencyRateProvider.getCurrencies().pipe(
			take(1),
			tap(currencyRateGroups =>
				ctx.patchState({
					rateGroups: this.mapRateGroups(currencyRateGroups),
					hasLoadedPersistedRates: true,
					isLoadingPersistedRates: false,
				})
			),
			catchError((error: unknown) => {
				ctx.patchState({
					isLoadingPersistedRates: false,
				});

				return throwError(() => error);
			})
		);
	}

	private mergeRateGroups(
		existingRateGroups: CurrencyRateGroupModel[],
		incomingRateGroups: CurrencyRateGroupModel[]
	): CurrencyRateGroupModel[] {
		const groupsByCurrencyId = new Map<number, CurrencyRateGroupModel>(
			existingRateGroups.map(group => [
				this.getRequiredCurrencyId(group),
				group,
			] as const)
		);

		for (const incomingGroup of incomingRateGroups) {
			const currencyId = this.getRequiredCurrencyId(incomingGroup);
			const existingGroup = groupsByCurrencyId.get(currencyId);

			if (!existingGroup) {
				groupsByCurrencyId.set(currencyId, {
					...incomingGroup,
					rateValues: this.orderRateValues(incomingGroup.rateValues ?? []),
				});

				continue;
			}

			const mergedRateValues = _.unionWith(
				incomingGroup.rateValues ?? [],
				existingGroup.rateValues ?? [],
				(left, right) =>
					this.getRateTimestamp(left) === this.getRateTimestamp(right)
			);

			groupsByCurrencyId.set(currencyId, {
				...existingGroup,
				...incomingGroup,
				rateValues: this.orderRateValues(mergedRateValues),
			});
		}

		return Array.from(groupsByCurrencyId.values());
	}

	private getRequiredCurrencyId(group: CurrencyRateGroupModel): number {
		const { currencyId } = group;

		if (currencyId === undefined) {
			throw new Error(
				'Cannot add a currency-rate group without a currency identifier.'
			);
		}

		return currencyId;
	}

	private orderRateValues(
		rateValues: CurrencyRateValueModel[]
	): CurrencyRateValueModel[] {
		return _.orderBy(rateValues, rate => this.getRateTimestamp(rate));
	}

	private getRateTimestamp(rate: CurrencyRateValueModel): number {
		const updateDate = rate.updateDate;

		if (updateDate instanceof Date) {
			return updateDate.getTime();
		}

		return Date.parse(String(updateDate));
	}

	private mapRateGroups(
		currencyRateGroups: CurrencyRateGroupModel[]
	): CurrencyRateGroupModel[] {
		return currencyRateGroups.map(rateGroup => ({
			currencyId: rateGroup.currencyId,
			name: rateGroup.name,
			abbreviation: rateGroup.abbreviation,
			scale: rateGroup.scale,
			rateValues: this.orderRateValues(rateGroup.rateValues ?? []),
		}));
	}
}
