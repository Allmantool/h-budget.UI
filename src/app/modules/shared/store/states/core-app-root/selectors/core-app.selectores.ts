import * as _ from 'lodash';

import { createSelector } from '@ngxs/store';

import { CoreAppState } from '../core-app.state';
import { ICoreAppStateModel } from '../models/core-app-state.model';

export const requestsUnderProcessing = createSelector(
	[CoreAppState],
	(state: ICoreAppStateModel) => state.requestsUnderProcessing
);
