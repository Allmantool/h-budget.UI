import { State, Action, StateContext } from '@ngxs/store';

import { IPaymenentAccountStateModel } from './models/payment-account-state.model';
import { SetActivePaymentAccount } from './actions/payment-acount.actions';

@State<IPaymenentAccountStateModel>({
	name: 'paymentAccount',
	defaults: {
		activeAccountGuid: '',
	},
	children: [],
})
export class PaymentAccountState {
	@Action(SetActivePaymentAccount)
	add(
		{ patchState }: StateContext<IPaymenentAccountStateModel>,
		{ paymentAccountId }: SetActivePaymentAccount
	): void {
		patchState({
			activeAccountGuid: paymentAccountId,
		});
	}
}
