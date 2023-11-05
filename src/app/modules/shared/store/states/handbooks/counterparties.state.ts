import { Injectable } from '@angular/core';

import { Action, State, StateContext } from '@ngxs/store';
import _ from 'lodash';
import { nameof } from 'ts-simple-nameof';

import { ICounterpartiesStateModel } from './models/ICounterpartiesStateModel';
import { AddCounterParty, SetInitialContractors } from './actions/counterparty.actions';
import { ContractorModel } from 'domain/models/accounting/contractor.model.';

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

		const orderedContractors = _.orderBy(
			[...newContractorsState, counterparty],
			nameof<ContractorModel>(op => op.nameNodes),
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
