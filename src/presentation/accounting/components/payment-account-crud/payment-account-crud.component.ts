import { ChangeDetectionStrategy, Component, OnDestroy, Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';

import { Observable, Subject, take } from 'rxjs';

import { PaymentAccountDialogService } from '../../services/payment-account-dialog.service';
import { DefaultPaymentAccountsProvider } from '../../../../data/providers/accounting/payment-accounts.provider';
import { Select } from '@ngxs/store';
import { getPaymentAccountId } from '../../../../app/modules/shared/store/states/accounting/selectors/payment-account.selector';

@Component({
	selector: 'payment-account-crud',
	templateUrl: './payment-account-crud.component.html',
	styleUrls: ['./payment-account-crud.component.css'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentAccountCrudComponent implements OnDestroy {
	private destroy$ = new Subject<void>();
	activePaymentAccountGuidSignal: Signal<string>;

	public ngOnDestroy(): void {
		this.destroy$.next();
		this.destroy$.complete();
	}

	@Select(getPaymentAccountId)
	paymentAccountId$!: Observable<string>;

	constructor(
		private readonly paymentAccountService: PaymentAccountDialogService,
		private readonly paymentAccountsProvider: DefaultPaymentAccountsProvider
	) {
		this.activePaymentAccountGuidSignal = toSignal(this.paymentAccountId$, {
			initialValue: '',
		});
	}

	public openCreatePaymentAccountDialog(): void {
		this.paymentAccountService.openPaymentAccount();
	}

	public RemovePaymentAccount(): void {
		const paymentAccountGuidForDelete = this.activePaymentAccountGuidSignal()!;
		this.paymentAccountsProvider
			.removePaymentAccount(paymentAccountGuidForDelete)
			.pipe(take(1))
			.subscribe();
	}
}
