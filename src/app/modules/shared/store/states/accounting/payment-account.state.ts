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
	UpdatePaymentAccount,
} from './actions/payment-acount.actions';

@State<IPaymenentAccountStateModel>({
	name: 'paymentAccount',
	defaults: {
		activeAccountGuid: '',
		accounts: [],
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
			accounts: [
				..._.filter(state?.accounts, function (p) {
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
			accounts: [..._.concat(state.accounts, paymentAccounts)],
		});
	}

	@Action(AddPaymentAccount)
	add(
		{ getState, patchState }: StateContext<IPaymenentAccountStateModel>,
		{ paymentAccount }: AddPaymentAccount
	): void {
		const state = getState();

		const accounts = [...state.accounts];
		accounts.push(paymentAccount);

		patchState({
			accounts: [...accounts],
		});
	}

	@Action(UpdatePaymentAccount)
	update(
		{ getState, patchState }: StateContext<IPaymenentAccountStateModel>,
		{ paymentAccount }: UpdatePaymentAccount
	): void {
		const state = getState();

		const accounts = [...state.accounts];

		const indexForUpdate = _.findIndex(accounts, function (i) {
			return _.isEqual(i.id?.toString(), paymentAccount.id?.toString());
		});

		accounts[indexForUpdate] = paymentAccount;

		patchState({
			accounts: [...accounts],
		});
	}

	@Action(SetInitialPaymentAccounts)
	setInitialPaymentAccounts(
		{ patchState }: StateContext<IPaymenentAccountStateModel>,
		{ paymentAccounts }: AddPaymentAccounts
	): void {
		patchState({
			accounts: [...paymentAccounts],
		});
	}
}
