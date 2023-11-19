import { createSelector } from '@ngxs/store';

import * as _ from 'lodash';

import { PaymentAccountState } from '../payment-account.state';
import { IPaymenentAccountStateModel } from '../models/payment-account-state.model';

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
