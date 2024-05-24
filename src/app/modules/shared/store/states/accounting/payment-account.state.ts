import { Injectable } from '@angular/core';

import * as _ from 'lodash';

import { Action, State, StateContext } from '@ngxs/store';

import {
	AddPaymentAccount,
	AddPaymentAccounts,
	RemovePaymentAccount,
	SetActivePaymentAccount,
	SetInitialPaymentAccounts,
	UpdatePaymentAccount,
} from './actions/payment-account.actions';
import { IPaymentAccountStateModel } from './models/payment-account-state.model';

@State<IPaymentAccountStateModel>({
	name: 'paymentAccounts',
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
		{ patchState }: StateContext<IPaymentAccountStateModel>,
		{ paymentAccountId }: SetActivePaymentAccount
	): void {
		patchState({
			activeAccountGuid: paymentAccountId,
		});
	}

	@Action(RemovePaymentAccount)
	remove(
		{ getState, patchState }: StateContext<IPaymentAccountStateModel>,
		{ paymentAccountId }: RemovePaymentAccount
	): void {
		const state = getState();

		patchState({
			accounts: [
				..._.filter(state?.accounts, function (p) {
					return p.key?.toString() !== paymentAccountId;
				}),
			],
		});
	}

	@Action(AddPaymentAccounts)
	addRange(
		{ getState, patchState }: StateContext<IPaymentAccountStateModel>,
		{ paymentAccounts }: AddPaymentAccounts
	): void {
		const state = getState();

		patchState({
			accounts: [..._.concat(state.accounts, paymentAccounts)],
		});
	}

	@Action(AddPaymentAccount)
	add(
		{ getState, patchState }: StateContext<IPaymentAccountStateModel>,
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
		{ getState, patchState }: StateContext<IPaymentAccountStateModel>,
		{ paymentAccount }: UpdatePaymentAccount
	): void {
		const state = getState();

		const accounts = [...state.accounts];

		const indexForUpdate = _.findIndex(accounts, function (i) {
			return _.isEqual(i.key?.toString(), paymentAccount.key?.toString());
		});

		accounts[indexForUpdate] = paymentAccount;

		patchState({
			accounts: [...accounts],
		});
	}

	@Action(SetInitialPaymentAccounts)
	setInitialPaymentAccounts(
		{ patchState }: StateContext<IPaymentAccountStateModel>,
		{ paymentAccounts }: AddPaymentAccounts
	): void {
		patchState({
			accounts: [...paymentAccounts],
		});
	}
}
