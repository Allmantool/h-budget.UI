import { ChangeDetectionStrategy, Component, OnDestroy, Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';

import { Observable, Subject, filter, take } from 'rxjs';
import { Select, Store } from '@ngxs/store';
import * as _ from 'lodash';

import { PaymentAccountDialogService } from '../../services/payment-account-dialog.service';
import { DefaultPaymentAccountsProvider } from '../../../../data/providers/accounting/payment-accounts.provider';
import { getActivePaymentAccountId } from '../../../../app/modules/shared/store/states/accounting/selectors/payment-account.selector';
import { RemovePaymentAccount } from '../../../../app/modules/shared/store/states/accounting/actions/payment-acount.actions';

@Component({
	selector: 'payment-account-crud',
	templateUrl: './payment-account-crud.component.html',
	styleUrls: ['./payment-account-crud.component.css'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentAccountCrudComponent implements OnDestroy {
	private destroy$ = new Subject<void>();
	public activePaymentAccountGuidSignal: Signal<string>;

	public ngOnDestroy(): void {
		this.destroy$.next();
		this.destroy$.complete();
	}

	@Select(getActivePaymentAccountId)
	paymentAccountId$!: Observable<string>;

	constructor(
		private readonly store: Store,
		private readonly paymentAccountService: PaymentAccountDialogService,
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
		this.paymentAccountService.openPaymentAccountForSave();
	}

	public updatePaymentAccount(): void {
		this.paymentAccountService.openPaymentAccountForUpdate(this.activePaymentAccountGuidSignal());
	}

	public removePaymentAccount(): void {
		const paymentAccountGuidForDelete = this.activePaymentAccountGuidSignal()!;

		this.paymentAccountsProvider
			.removePaymentAccount(paymentAccountGuidForDelete)
			.pipe(
				filter((payload) => payload.isSucceeded),
				take(1)
			)
			.subscribe(() => {
				this.store.dispatch(new RemovePaymentAccount(paymentAccountGuidForDelete));
			});
	}

	public EditPaymentAccount(): void {}
}
