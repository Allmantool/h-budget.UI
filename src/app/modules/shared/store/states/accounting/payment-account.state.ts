import { Injectable } from '@angular/core';

import { State, Action, StateContext } from '@ngxs/store';
import * as _ from 'lodash';

import { IPaymenentAccountStateModel } from './models/payment-account-state.model';
import {
	AddPaymentAccount,
	AddPaymentAccounts,
	RemovePaymentAccount,
	SetActivePaymentAccount,
	SetInitialPaymentAccounts,
} from './actions/payment-acount.actions';

@State<IPaymenentAccountStateModel>({
	name: 'paymentAccount',
	defaults: {
		activeAccountGuid: '',
		paymentAccounts: [],
	},
	children: [],
})
@Injectable()
export class PaymentAccountState {
	@Action(SetActivePaymentAccount)
	setActive(
		{ patchState }: StateContext<IPaymenentAccountStateModel>,
		{ paymentAccountId }: SetActivePaymentAccount
	): void {
		patchState({
			activeAccountGuid: paymentAccountId,
		});
	}

	@Action(RemovePaymentAccount)
	remove(
		{ getState, patchState }: StateContext<IPaymenentAccountStateModel>,
		{ paymentAccountId }: RemovePaymentAccount
	): void {
		const state = getState();

		patchState({
			paymentAccounts: [
				..._.filter(state?.paymentAccounts, function (p) {
					return p.id?.toString() !== paymentAccountId;
				}),
			],
		});
	}

	@Action(AddPaymentAccounts)
	addRange(
		{ getState, patchState }: StateContext<IPaymenentAccountStateModel>,
		{ paymentAccounts }: AddPaymentAccounts
	): void {
		const state = getState();

		patchState({
			paymentAccounts: [..._.concat(state.paymentAccounts, paymentAccounts)],
		});
	}

	@Action(AddPaymentAccount)
	add(
		{ getState, patchState }: StateContext<IPaymenentAccountStateModel>,
		{ paymentAccount }: AddPaymentAccount
	): void {
		const state = getState();

		const accounts = [...state.paymentAccounts];
		accounts.push(paymentAccount);

		patchState({
			paymentAccounts: [...accounts],
		});
	}

	@Action(SetInitialPaymentAccounts)
	setInitialPaymentAccounts(
		{ patchState }: StateContext<IPaymenentAccountStateModel>,
		{ paymentAccounts }: AddPaymentAccounts
	): void {
		patchState({
			paymentAccounts: [...paymentAccounts],
		});
	}
}
