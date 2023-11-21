import * as _ from 'lodash';

import { createSelector } from '@ngxs/store';

import { IPaymenentAccountStateModel } from '../models/payment-account-state.model';
import { PaymentAccountState } from '../payment-account.state';

export const getActivePaymentAccountId = createSelector(
	[PaymentAccountState],
	(state: IPaymenentAccountStateModel) => state?.activeAccountGuid
);

export const getActivePaymentAccount = createSelector([PaymentAccountState], (state: IPaymenentAccountStateModel) =>
	_.find(state?.accounts, function (account) {
		return account.key?.toString() === state?.activeAccountGuid;
	})
);

export const getPaymentAccounts = createSelector(
	[PaymentAccountState],
	(state: IPaymenentAccountStateModel) => state?.accounts
);
