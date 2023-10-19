import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatListOption, MatSelectionList } from '@angular/material/list';
import { SelectionModel } from '@angular/cdk/collections';

import { Store } from '@ngxs/store';
import { Subject, retry, take } from 'rxjs';
import { Guid } from 'typescript-guid';
import * as _ from 'lodash';

import { PaymentAccountModel } from '../../../../domain/models/accounting/payment-account';
import { SetActivePaymentAccount } from '../../../../app/modules/shared/store/states/accounting/actions/payment-acount.actions';
import { DefaultPaymentAccountsProvider } from '../../../../data/providers/accounting/payment-accounts.provider';
import { AccountTypes } from '../../../../domain/models/accounting/account-types';

@Component({
	selector: 'payment-accounts',
	templateUrl: './payment-account.component.html',
	styleUrls: ['./payment-account.component.css'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentAccountComponent implements OnInit, OnDestroy {
	private destroy$ = new Subject<void>();

	@ViewChild('cash')
	chipGrid!: MatSelectionList;

	public isNavigateToOperationsDisabled: boolean = true;

	constructor(
		private readonly paymentAccountsProvider: DefaultPaymentAccountsProvider,
		private readonly route: ActivatedRoute,
		private readonly router: Router,
		private readonly store: Store
	) {}

	public ngOnInit(): void {
		this.paymentAccountsProvider
			.getPaymentAccounts()
			.pipe(retry(1), take(1))
			.subscribe((accounts) => {
				this.cashAccounts = _.filter(accounts, ['type', AccountTypes.WalletCache]);
				this.debitVirtualAccounts = _.filter(accounts, ['type', AccountTypes.Virtual]);
				this.creditVirtualAccounts = _.filter(accounts, ['type', AccountTypes.Loan]);
			});
	}

	public ngOnDestroy(): void {
		this.destroy$.next();
		this.destroy$.complete();
	}

	public cashAccounts: PaymentAccountModel[] = [];

	public debitVirtualAccounts: PaymentAccountModel[] = [];

	public creditVirtualAccounts: PaymentAccountModel[] = [];

	public step: number = 0;

	public setStep(index: number) {
		this.step = index;
	}

	public nextStep() {
		this.step++;
	}

	public prevStep() {
		this.step--;
	}

	public chooseAcccount(): void {
		const selectedOptions: SelectionModel<MatListOption> = this.chipGrid.selectedOptions;

		const guid = _.first(selectedOptions.selected)?.value as Guid;

		this.store.dispatch(new SetActivePaymentAccount(guid.toString()));

		this.isNavigateToOperationsDisabled = false;

		return;
	}

	public async navigateToOperations(): Promise<void> {
		await this.router.navigate(
			[
				{
					outlets: { primary: ['operations'], rightSidebar: ['operations'] },
				},
			],
			{ relativeTo: this.route }
		);
	}
}
