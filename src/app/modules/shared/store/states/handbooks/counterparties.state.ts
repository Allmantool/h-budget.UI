import { Injectable } from '@angular/core';

import _ from 'lodash';

import { Action, State, StateContext } from '@ngxs/store';
import { nameof } from 'ts-simple-nameof';

import { AddCounterParty, SetInitialContractors } from './actions/counterparty.actions';
import { ICounterpartiesStateModel } from './models/ICounterpartiesStateModel';
import { IContractorModel } from 'domain/models/accounting/contractor.model.';

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

		const orderedContractors = _.orderBy(
			[...newContractorsState, counterparty],
			nameof<IContractorModel>(op => op.nameNodes),
			['asc']
		);

		patchState({
			counterparties: [...orderedContractors],
		});
	}

	@Action(SetInitialContractors)
	setInitialContractors(
		{ patchState }: StateContext<ICounterpartiesStateModel>,
		{ contractors }: SetInitialContractors
	): void {
		patchState({
			counterparties: [...contractors],
		});
	}
}
