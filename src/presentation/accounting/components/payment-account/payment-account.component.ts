import {
	ChangeDetectionStrategy,
	Component,
	EnvironmentInjector,
	OnInit,
	runInInjectionContext,
	signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatSelectionListChange } from '@angular/material/list';
import { ActivatedRoute, Router } from '@angular/router';

import * as _ from 'lodash';

import { Select, Store } from '@ngxs/store';
import { Observable, retry, take } from 'rxjs';
import { nameof } from 'ts-simple-nameof';
import { Guid } from 'typescript-guid';

import { SetActivePaymentAccount } from '../../../../app/modules/shared/store/states/accounting/actions/payment-acount.actions';
import { SetInitialPaymentAccounts } from '../../../../app/modules/shared/store/states/accounting/actions/payment-acount.actions';
import { getPaymentAccounts } from '../../../../app/modules/shared/store/states/accounting/selectors/payment-account.selector';
import { DefaultPaymentAccountsProvider } from '../../../../data/providers/accounting/payment-accounts.provider';
import { AccountTypes } from '../../../../domain/models/accounting/account-types';
import { IPaymentAccountModel } from '../../../../domain/models/accounting/payment-account.model';

@Component({
	selector: 'payment-accounts',
	templateUrl: './payment-account.component.html',
	styleUrls: ['./payment-account.component.css'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentAccountComponent implements OnInit {
	public isNavigateToOperationsDisabled: boolean = true;
	public cashAccountsSignal = signal<IPaymentAccountModel[]>([]);
	public debitVirtualAccountsSignal = signal<IPaymentAccountModel[]>([]);
	public creditVirtualAccountsSignal = signal<IPaymentAccountModel[]>([]);

	@Select(getPaymentAccounts)
	paymentAccounts$!: Observable<IPaymentAccountModel[]>;

	constructor(
		private injector: EnvironmentInjector,
		private readonly paymentAccountsProvider: DefaultPaymentAccountsProvider,
		private readonly route: ActivatedRoute,
		private readonly router: Router,
		private readonly store: Store
	) {}

	public ngOnInit(): void {
		this.paymentAccountsProvider
			.getPaymentAccounts()
			.pipe(retry(1), take(1))
			.subscribe(accounts => {
				this.store.dispatch(new SetInitialPaymentAccounts(accounts));
			});

		runInInjectionContext(this.injector, () => {
			this.paymentAccounts$.pipe(takeUntilDestroyed()).subscribe(accounts => {
				this.cashAccountsSignal.set(
					_.filter(accounts, [nameof<IPaymentAccountModel>(p => p.type), AccountTypes.WalletCache])
				);

				this.debitVirtualAccountsSignal.set(
					_.filter(accounts, [nameof<IPaymentAccountModel>(p => p.type), AccountTypes.Virtual])
				);

				this.creditVirtualAccountsSignal.set(
					_.filter(accounts, [nameof<IPaymentAccountModel>(p => p.type), AccountTypes.Loan])
				);
			});
		});
	}

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

	public chooseAcccount(event: MatSelectionListChange): void {
		const options = event.options;

		const guid = _.first(options)?.value as Guid;

		this.store.dispatch(new SetActivePaymentAccount(guid.toString()));

		this.isNavigateToOperationsDisabled = false;
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
