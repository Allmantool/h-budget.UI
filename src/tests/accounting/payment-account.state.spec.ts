import { TestBed } from '@angular/core/testing';

import { NgxsModule, Store } from '@ngxs/store';
import { Guid } from 'typescript-guid';

import { ngxsConfig } from '../../app/modules/shared/store/ngxs.config';
import {
	RemovePaymentAccount,
	SetActivePaymentAccount,
	SetInitialPaymentAccounts,
} from '../../app/modules/shared/store/states/accounting/actions/payment-account.actions';
import { PaymentAccountState } from '../../app/modules/shared/store/states/accounting/payment-account.state';
import {
	getActivePaymentAccountId,
	getPaymentAccounts,
} from '../../app/modules/shared/store/states/accounting/selectors/payment-account.selector';
import { AccountTypes } from '../../domain/models/accounting/account-types';
import { IPaymentAccountModel } from '../../domain/models/accounting/payment-account.model';

describe('payment account state', () => {
	const deletedId = '0879167a-a6e8-4518-9850-4dd87a4e5be6';
	const preservedId = '24a07833-5cf5-4885-b09d-32c089fac4dd';
	let store: Store;

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [NgxsModule.forRoot([PaymentAccountState], ngxsConfig)],
		});
		store = TestBed.inject(Store);
	});

	it('should remove every duplicate of the requested account and preserve other balances', () => {
		const duplicate = createAccount(deletedId, 200.12, 'Bank card duplicate');
		const preserved = createAccount(preservedId, 125.34, 'Cash box');
		store.dispatch(
			new SetInitialPaymentAccounts([createAccount(deletedId, 200.12, 'Bank card'), preserved, duplicate])
		);

		store.dispatch(new RemovePaymentAccount(deletedId));

		expect(store.selectSnapshot(getPaymentAccounts)).toEqual([preserved]);
		expect(store.selectSnapshot(getPaymentAccounts)[0].balance).toBe(125.34);
	});

	it('should clear only a deleted active account', () => {
		const deleted = createAccount(deletedId, 200.12, 'Bank card');
		const preserved = createAccount(preservedId, 125.34, 'Cash box');
		store.dispatch(new SetInitialPaymentAccounts([deleted, preserved]));
		store.dispatch(new SetActivePaymentAccount(deletedId));

		store.dispatch(new RemovePaymentAccount(deletedId));

		expect(store.selectSnapshot(getActivePaymentAccountId)).toBe('');

		store.dispatch(new SetActivePaymentAccount(preservedId));
		store.dispatch(new RemovePaymentAccount(deletedId));

		expect(store.selectSnapshot(getActivePaymentAccountId)).toBe(preservedId);
	});

	function createAccount(id: string, balance: number, emitter: string): IPaymentAccountModel {
		return {
			key: Guid.parse(id),
			type: AccountTypes.Virtual,
			currency: 'BYN',
			balance,
			emitter,
			description: 'Account',
		};
	}
});
