import { ChangeDetectionStrategy, Component, Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';

import * as _ from 'lodash';

import { Select, Store } from '@ngxs/store';
import { filter, Observable, take } from 'rxjs';

import { RemovePaymentAccount } from '../../../../app/modules/shared/store/states/accounting/actions/payment-account.actions';
import { getActivePaymentAccountId } from '../../../../app/modules/shared/store/states/accounting/selectors/payment-account.selector';
import { DefaultPaymentAccountsProvider } from '../../../../data/providers/accounting/payment-accounts.provider';
import { PaymentAccountDialogService } from '../../services/payment-account-dialog.service';

@Component({
	selector: 'payment-account-crud',
	templateUrl: './payment-account-crud.component.html',
	styleUrls: ['./payment-account-crud.component.css'],
	changeDetection: ChangeDetectionStrategy.OnPush,
	standalone: false
})
export class PaymentAccountCrudComponent {
	public activePaymentAccountGuidSignal: Signal<string>;

	@Select(getActivePaymentAccountId)
	paymentAccountId$!: Observable<string>;

	constructor(
		private readonly store: Store,
		private readonly paymentAccountDialogService: PaymentAccountDialogService,
		private readonly paymentAccountsProvider: DefaultPaymentAccountsProvider
	) {
		this.activePaymentAccountGuidSignal = toSignal(this.paymentAccountId$, {
			initialValue: '',
		});
	}

	public get isAnyPaymentAccountSelected(): boolean {
		return _.isEmpty(this.activePaymentAccountGuidSignal());
	}

	public createNewPaymentAccount(): void {
		this.paymentAccountDialogService.openForSave();
	}

	public updatePaymentAccount(): void {
		this.paymentAccountDialogService.openForUpdate(this.activePaymentAccountGuidSignal());
	}

	public removePaymentAccount(): void {
		this.paymentAccountsProvider
			.removePaymentAccount(this.activePaymentAccountGuidSignal())
			.pipe(
				filter(payload => payload.isSucceeded),
				take(1)
			)
			.subscribe(() => {
				this.store.dispatch(new RemovePaymentAccount(this.activePaymentAccountGuidSignal()));
			});
	}
}
