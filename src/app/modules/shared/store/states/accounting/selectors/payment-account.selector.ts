import * as _ from 'lodash';

import { createSelector } from '@ngxs/store';

import { IPaymentAccountStateModel } from '../models/payment-account-state.model';
import { PaymentAccountState } from '../payment-account.state';

export const getActivePaymentAccountId = createSelector(
	[PaymentAccountState],
	(state: IPaymentAccountStateModel) => state?.activeAccountGuid
);

export const getActivePaymentAccount = createSelector([PaymentAccountState], (state: IPaymentAccountStateModel) =>
	_.find(state?.accounts, function (account) {
		return account.key?.toString() === state?.activeAccountGuid;
	})
);

export const getPaymentAccounts = createSelector(
	[PaymentAccountState],
	(state: IPaymentAccountStateModel) => state?.accounts
);
