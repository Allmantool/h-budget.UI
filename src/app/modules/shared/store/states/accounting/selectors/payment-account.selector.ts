import { createSelector } from '@ngxs/store';

import { PaymentAccountState } from '../payment-account.state';
import { IPaymenentAccountStateModel } from '../models/payment-account-state.model';

export const getPaymentAccountId = createSelector(
	[PaymentAccountState],
	(state: IPaymenentAccountStateModel) => state?.activeAccountGuid
);
