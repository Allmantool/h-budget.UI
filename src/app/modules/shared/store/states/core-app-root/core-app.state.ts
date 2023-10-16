import { Injectable } from '@angular/core';

import { State, Action, StateContext } from '@ngxs/store';
import * as _ from 'lodash';

import { ICoreAppStateModel } from './models/core-app-state.model';
import { AddProcessingRequest, RemoveProcessingRequest } from './actions/core-app.actions';

@State<ICoreAppStateModel>({
	name: 'coreAppState',
	defaults: {
		requestsUnderProcessing: [],
	},
})
@Injectable()
export class CoreAppState {
	@Action(AddProcessingRequest)
	add(
		{ getState, patchState }: StateContext<ICoreAppStateModel>,
		{ requestCorrelationId }: AddProcessingRequest
	): void {
		const requestUnderProcessing = [...getState().requestsUnderProcessing];

		requestUnderProcessing.push(requestCorrelationId);

		patchState({
			requestsUnderProcessing: [...requestUnderProcessing],
		});
	}

	@Action(RemoveProcessingRequest)
	DeleleProcessingRequest(
		{ getState, patchState }: StateContext<ICoreAppStateModel>,
		{ requestCorrelationId }: RemoveProcessingRequest
	): void {
		patchState({
			requestsUnderProcessing: [
				..._.filter(getState().requestsUnderProcessing, requestCorrelationId),
			],
		});
	}
}
