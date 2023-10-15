import { ChangeDetectionStrategy, Component, OnDestroy } from '@angular/core';

import { Subject } from 'rxjs';

import { PaymentAccountDialogService } from '../../services/payment-account-dialog.service';

@Component({
	selector: 'payment-account-crud',
	templateUrl: './payment-account-crud.component.html',
	styleUrls: ['./payment-account-crud.component.css'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentAccountCrudComponent implements OnDestroy {
	private destroy$ = new Subject<void>();

	public ngOnDestroy(): void {
		this.destroy$.next();
		this.destroy$.complete();
	}

	constructor(private readonly paymentAccountService: PaymentAccountDialogService) {}

	public openCreatePaymentAccountDialog(): void {
		this.paymentAccountService.openPaymentAccount();
	}
}
