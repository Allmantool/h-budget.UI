import { createSelector } from '@ngxs/store';

import * as _ from 'lodash';

import { ICoreAppStateModel } from '../models/core-app-state.model';
import { CoreAppState } from '../core-app.state';

export const requestsUnderProcessing = createSelector(
	[CoreAppState],
	(state: ICoreAppStateModel) => state.requestsUnderProcessing
);
