
import { ChangeDetectionStrategy, Component, OnDestroy, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatListOption, MatSelectionList } from '@angular/material/list';
import { SelectionModel } from '@angular/cdk/collections';

import { Subject } from 'rxjs';
import { Store } from '@ngxs/store';
import { Guid } from 'typescript-guid';
import * as _ from 'lodash';

import { PaymentAccount } from '../../../../domain/models/accounting/payment-account';
import { AccountTypes } from '../../../../domain/models/accounting/account-types';
import { CurrencyAbbrevitions } from '../../../../app/modules/shared/constants/rates-abbreviations';
import { SetActivePaymentAccount } from '../../../../app/modules/shared/store/states/accounting/actions/payment-acount.actions';

@Component({
	selector: 'payment-accounts',
	templateUrl: './payment-account.component.html',
	styleUrls: ['./payment-account.component.css'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentAccountComponent implements OnDestroy {
	private destroy$ = new Subject<void>();

	@ViewChild('cash')
	chipGrid!: MatSelectionList;

	public isNavigateToOperationsDisabled: boolean = true;

	constructor(
		private readonly route: ActivatedRoute,
		private readonly router: Router,
		private readonly store: Store
	) {}

	public ngOnDestroy(): void {
		this.destroy$.next();
		this.destroy$.complete();
	}

	public cashAccounts: PaymentAccount[] = [
		{
			id: Guid.create(),
			type: AccountTypes.WalletCache,
			balance: 62.08,
			currency: CurrencyAbbrevitions.BYN,
			agent: 'Cache',
			description: `Cache ${CurrencyAbbrevitions.BYN}`,
		},
		{
			id: Guid.create(),
			type: AccountTypes.WalletCache,
			balance: 978.24,
			currency: CurrencyAbbrevitions.USD,
			agent: '',
			description: `Cache ${CurrencyAbbrevitions.USD}`,
		},
		{
			id: Guid.create(),
			type: AccountTypes.WalletCache,
			balance: 1500.24,
			currency: CurrencyAbbrevitions.EUR,
			agent: 'Cache',
			description: `Cache ${CurrencyAbbrevitions.EUR}`,
		},
		{
			id: Guid.create(),
			type: AccountTypes.WalletCache,
			balance: 32,
			currency: CurrencyAbbrevitions.PLN,
			agent: '',
			description: `Cache ${CurrencyAbbrevitions.PLN}`,
		},
	];

	public debitVirtualAccounts: string[] = [
		'[USD -- TechBank] Plastic Card -- MasterCard',
		'[BYN -- PriorBank] Plastic Card -- Visa',
		'[USD -- PriorBank] Plastic Card -- Visa',
	];

	public creditVirtualAccounts: string[] = ['[USD -- Vtb] Plastic Card -- МИР'];

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
