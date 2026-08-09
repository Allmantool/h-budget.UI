import { Injectable } from '@angular/core';

import { Store } from '@ngxs/store';
import { map, Observable, take, tap } from 'rxjs';
import { Guid } from 'typescript-guid';

import { IAccountsService } from './interfaces/iaccounts.service';
import { UpdatePaymentAccount } from '../../../app/modules/shared/store/states/accounting/actions/payment-account.actions';
import { DefaultPaymentAccountsProvider } from '../../../data/providers/accounting/payment-accounts.provider';

@Injectable()
export class AccountsService implements IAccountsService {
	constructor(
		private readonly paymentAccountsProvider: DefaultPaymentAccountsProvider,
		private readonly store: Store
	) {}

	public refreshAccounts(paymentAccountId: string | Guid): Observable<void> {
		return this.paymentAccountsProvider.getById(paymentAccountId).pipe(
			take(1),
			tap(payload => this.store.dispatch(new UpdatePaymentAccount(payload))),
			map(() => undefined)
		);
	}
}
