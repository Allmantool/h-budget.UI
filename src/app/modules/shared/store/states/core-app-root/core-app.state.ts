import { Injectable } from '@angular/core';

import * as _ from 'lodash';

import { Action, State, StateContext } from '@ngxs/store';

import { AddProcessingRequest, RemoveProcessingRequest } from './actions/core-app.actions';
import { ICoreAppStateModel } from './models/core-app-state.model';

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
	deleleProcessingRequest(
		{ getState, patchState }: StateContext<ICoreAppStateModel>,
		{ requestCorrelationId }: RemoveProcessingRequest
	): void {
		const requestUnderProcessing = [...getState().requestsUnderProcessing];

		patchState({
			requestsUnderProcessing: [..._.filter(requestUnderProcessing, requestCorrelationId)],
		});
	}
}
