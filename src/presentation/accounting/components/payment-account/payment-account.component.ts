import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { ActivatedRoute, Router } from '@angular/router';

import * as _ from 'lodash';

import { Store } from '@ngxs/store';
import { Observable, take } from 'rxjs';

import { CurrencyAbbreviationToFlagFormatPipe } from '../../../../app/modules/shared/pipes/currency-abbreviation-to-flag.pipe';
import { LoaderService } from '../../../../app/modules/shared/services/loader-service';
import {
	RemovePaymentAccount,
	SetActivePaymentAccount,
	SetInitialPaymentAccounts,
} from '../../../../app/modules/shared/store/states/accounting/actions/payment-account.actions';
import { getPaymentAccounts } from '../../../../app/modules/shared/store/states/accounting/selectors/payment-account.selector';
import { DefaultPaymentAccountsProvider } from '../../../../data/providers/accounting/payment-accounts.provider';
import { AccountTypes } from '../../../../domain/models/accounting/account-types';
import { IPaymentAccountModel } from '../../../../domain/models/accounting/payment-account.model';
import { PaymentAccountDeletionService } from '../../services/payment-account-deletion.service';
import { PaymentAccountDialogService } from '../../services/payment-account-dialog.service';

@Component({
	selector: 'payment-accounts',
	templateUrl: './payment-account.component.html',
	styleUrls: ['./payment-account.component.css'],
	changeDetection: ChangeDetectionStrategy.OnPush,
	standalone: true,
	imports: [MatButtonModule, MatIconModule, MatMenuModule, CurrencyAbbreviationToFlagFormatPipe],
})
export class PaymentAccountComponent implements OnInit {
	private readonly destroyRef = inject(DestroyRef);
	private readonly paymentAccountsProvider = inject(DefaultPaymentAccountsProvider);
	private readonly paymentAccountDialogService = inject(PaymentAccountDialogService);
	private readonly paymentAccountDeletionService = inject(PaymentAccountDeletionService);
	private readonly route = inject(ActivatedRoute);
	private readonly router = inject(Router);
	private readonly store = inject(Store);
	private selectedPaymentAccountId?: string;
	public readonly loaderService = inject(LoaderService);
	public readonly deletionStatusSignal = signal('');
	public cashAccountsSignal = signal<IPaymentAccountModel[]>([]);
	public debitVirtualAccountsSignal = signal<IPaymentAccountModel[]>([]);
	public creditVirtualAccountsSignal = signal<IPaymentAccountModel[]>([]);
	public paymentAccounts$: Observable<IPaymentAccountModel[]> = this.store.select(getPaymentAccounts);

	public ngOnInit(): void {
		this.loaderService
			.withLoader(this.paymentAccountsProvider.getPaymentAccounts())
			.subscribe(accounts => this.store.dispatch(new SetInitialPaymentAccounts(accounts)).pipe(take(1)));

		this.paymentAccounts$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(accounts => {
			this.cashAccountsSignal.set(
				_.filter(accounts, (account: IPaymentAccountModel) => account.type === AccountTypes.WalletCache)
			);

			this.debitVirtualAccountsSignal.set(
				_.filter(accounts, (account: IPaymentAccountModel) => account.type === AccountTypes.Virtual)
			);

			this.creditVirtualAccountsSignal.set(
				_.filter(
					accounts,
					(account: IPaymentAccountModel) =>
						account.type === AccountTypes.Loan || account.type === AccountTypes.Credit
				)
			);
		});
	}

	public get totalAccountsCount(): number {
		return (
			this.cashAccountsSignal().length +
			this.debitVirtualAccountsSignal().length +
			this.creditVirtualAccountsSignal().length
		);
	}

	public selectPaymentAccount(paymentAccount: IPaymentAccountModel): void {
		const paymentAccountId = paymentAccount.key?.toString();

		if (!paymentAccountId) {
			return;
		}

		this.store.dispatch(new SetActivePaymentAccount(paymentAccountId));
		this.selectedPaymentAccountId = paymentAccountId;
	}

	public createNewPaymentAccount(): void {
		this.paymentAccountDialogService.openForSave();
	}

	public updateSelectedPaymentAccount(): void {
		if (_.isNil(this.selectedPaymentAccountId)) {
			return;
		}

		this.paymentAccountDialogService.openForUpdate(this.selectedPaymentAccountId);
	}

	public deletePaymentAccount(paymentAccount: IPaymentAccountModel): void {
		this.deletionStatusSignal.set('');
		this.paymentAccountDeletionService
			.open(paymentAccount)
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe(deletedAccount => {
				const deletedAccountId = deletedAccount?.key?.toString();
				if (!deletedAccount || !deletedAccountId) {
					return;
				}

				this.store.dispatch(new RemovePaymentAccount(deletedAccountId));
				if (this.selectedPaymentAccountId === deletedAccountId) {
					this.selectedPaymentAccountId = undefined;
				}
				this.deletionStatusSignal.set(`${deletedAccount.emitter} was deleted.`);
			});
	}

	public get selectedPaymentAccount(): IPaymentAccountModel | undefined {
		return this.store
			.selectSnapshot(getPaymentAccounts)
			.find(paymentAccount => paymentAccount.key?.toString() === this.selectedPaymentAccountId);
	}

	public isSelectedPaymentAccount(paymentAccount: IPaymentAccountModel): boolean {
		return paymentAccount.key?.toString() === this.selectedPaymentAccountId;
	}

	public async openPaymentAccount(paymentAccount: IPaymentAccountModel): Promise<void> {
		this.selectPaymentAccount(paymentAccount);
		await this.navigateToOperations();
	}

	public async navigateToOperations(): Promise<void> {
		if (_.isNil(this.selectedPaymentAccountId)) {
			return;
		}
		const accountingWorkspaceRoute = this.route.parent?.parent;

		if (_.isNil(accountingWorkspaceRoute)) {
			return;
		}

		await this.router.navigate(
			[
				{
					outlets: {
						primary: ['operations'],
					},
				},
			],
			{
				relativeTo: accountingWorkspaceRoute,
				queryParams: { paymentAccountId: this.selectedPaymentAccountId },
			}
		);
	}

	public getAccountsTotalBalance(accounts: IPaymentAccountModel[]): number {
		return _.round(
			_.sumBy(accounts, account => account.balance),
			2
		);
	}
}
