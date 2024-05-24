import { ChangeDetectionStrategy, Component, computed, OnInit, signal, Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';

import _ from 'lodash';

import { Select, Store } from '@ngxs/store';
import { Observable } from 'rxjs';
import { Guid } from 'typescript-guid';

import { CrossAccountsTransferService } from 'presentation/accounting/services/cross-accounts-transfer.dialog.service';

import { SetActiveAccountingOperation } from '../../../../app/modules/shared/store/states/accounting/actions/accounting-table-options.actions';
import {
	getActivePaymentAccount,
	getActivePaymentAccountId,
} from '../../../../app/modules/shared/store/states/accounting/selectors/payment-account.selector';
import { IPaymentAccountModel } from '../../../../domain/models/accounting/payment-account.model';

@Component({
	selector: 'payments-dashboard',
	templateUrl: './payments-dashboard.component.html',
	styleUrls: ['./payments-dashboard.component.css'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentsDashboardComponent implements OnInit {
	public paymentAccountGeneralInfoSignal: Signal<string> = signal('');

	@Select(getActivePaymentAccountId)
	public getActivePaymentAccountId$!: Observable<Guid>;

	@Select(getActivePaymentAccount)
	public activePaymentAccount$!: Observable<IPaymentAccountModel>;

	public activePaymentsAccountSignal: Signal<IPaymentAccountModel> = toSignal(this.activePaymentAccount$, {
		initialValue: {} as IPaymentAccountModel,
	});

	public activePaymentAccountIdSignal: Signal<Guid> = toSignal(this.getActivePaymentAccountId$, {
		initialValue: Guid.EMPTY,
	});

	constructor(
		private readonly router: Router,
		private readonly store: Store,
		private readonly accountsTransferService: CrossAccountsTransferService
	) {
		this.paymentAccountGeneralInfoSignal = computed(
			() => `${this.activePaymentAccountIdSignal()?.toString()}
				${this.activePaymentsAccountSignal().emitter} | ${this.activePaymentsAccountSignal().description}`
		);
	}

	public async ngOnInit(): Promise<void> {
		if (_.isNil(this.activePaymentsAccountSignal())) {
			await this.navigateToPaymentAccountsAsync();
			return;
		}
	}

	public async navigateToPaymentAccountsAsync(): Promise<void> {
		this.store.dispatch(new SetActiveAccountingOperation(undefined));
		await this.router.navigate(['/dashboard/accounting'], { relativeTo: null });
	}

	public moneyTransfer(): void {
		this.accountsTransferService.openForTransfer();
	}
}
