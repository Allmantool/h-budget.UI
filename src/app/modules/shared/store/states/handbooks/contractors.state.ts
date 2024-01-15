import { Injectable } from '@angular/core';

import _ from 'lodash';

import { Action, State, StateContext } from '@ngxs/store';
import { nameof } from 'ts-simple-nameof';

import { AddCounterParty, SetInitialContractors } from './actions/contractor.actions';
import { IContractorsStateModel } from './models/IContractorsStateModel';
import { IContractorModel } from 'domain/models/accounting/contractor.model.';

@State<IContractorsStateModel>({
	name: 'contractorsHandbook',
	defaults: {
		contractors: [],
	},
	children: [],
})
@Injectable()
export class ContractorsState {
	@Action(AddCounterParty)
	AddCounterParty(
		{ getState, patchState }: StateContext<IContractorsStateModel>,
		{ newContractor }: AddCounterParty
	): void {
		const newContractorsState = [...getState().contractors];

		const orderedContractors = _.orderBy(
			[...newContractorsState, newContractor],
			nameof<IContractorModel>(op => op.nameNodes),
			['asc']
		);

		patchState({
			contractors: [...orderedContractors],
		});
	}

	@Action(SetInitialContractors)
	setInitialContractors(
		{ patchState }: StateContext<IContractorsStateModel>,
		{ contractors }: SetInitialContractors
	): void {
		patchState({
			contractors: [...contractors],
		});
	}
}
