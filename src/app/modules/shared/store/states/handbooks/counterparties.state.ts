import { Injectable } from '@angular/core';

import { Action, State, StateContext } from '@ngxs/store';

import { ICounterpartiesStateModel } from './models/ICounterpartiesStateModel';
import { AddCounterParty, SetInitialContractors } from './actions/counterparty.actions';

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
		const newContractorsState = [...getState().counterparties];

		newContractorsState.push(counterparty);

		patchState({
			counterparties: newContractorsState,
		});
	}

	@Action(SetInitialContractors)
	setInitialPaymentAccounts(
		{ patchState }: StateContext<ICounterpartiesStateModel>,
		{ contractors }: SetInitialContractors
	): void {
		patchState({
			counterparties: [...contractors],
		});
	}
}
