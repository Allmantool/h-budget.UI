import { Injectable } from '@angular/core';

import { Action, State, StateContext } from '@ngxs/store';

import { ICounterpartiesStateModel } from './models/ICounterpartiesStateModel';
import { AddCounterParty } from './actions/counterparty.actions';

@State<ICounterpartiesStateModel>({
	name: 'counterpartiesHandbook',
	defaults: {
		counterparties: [],
	},
	children: [],
})
@Injectable()
export class CounterpartiesState {
	@Action(AddCounterParty)
	AddCounterParty(
		{ getState, patchState }: StateContext<ICounterpartiesStateModel>,
		{ counterparty }: AddCounterParty
	): void {
		const state = getState();

		const items = [...state.counterparties, counterparty];

		patchState({
			counterparties: items,
		});
	}
}
