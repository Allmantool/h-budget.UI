import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';

import { Store } from '@ngxs/store';
import { finalize, take } from 'rxjs';

import { getPaymentAccounts } from '../../../../app/modules/shared/store/states/accounting/selectors/payment-account.selector';
import { IPaymentAccountModel } from '../../../../domain/models/accounting/payment-account.model';
import { IPaymentOperationModel } from '../../../../domain/models/accounting/payment-operation.model';
import { CrossAccountsTransferProvider } from '../../../../data/providers/accounting/cross-accounts-transfer.provider';
import { TransferDeleteDialogComponent } from '../transfer-delete-dialog/transfer-delete-dialog.component';

@Component({
	selector: 'transfer-details',
	templateUrl: './transfer-details.component.html',
	styleUrls: ['./transfer-details.component.css'],
	changeDetection: ChangeDetectionStrategy.OnPush,
	standalone: true,
	imports: [DatePipe, DecimalPipe, MatButtonModule],
})
export class TransferDetailsComponent {
	@Input({ required: true }) public activeAccount?: IPaymentAccountModel;
	@Input({ required: true }) public operation?: IPaymentOperationModel;
	@Output() public readonly closeRequested = new EventEmitter<void>();
	@Output() public readonly deleted = new EventEmitter<void>();

	public readonly isDeletingSignal = signal(false);
	public readonly deleteErrorSignal = signal('');
	public readonly paymentAccountsSignal = toSignal(this.store.select(getPaymentAccounts), { initialValue: [] });

	constructor(
		private readonly transferProvider: CrossAccountsTransferProvider,
		private readonly dialog: MatDialog,
		private readonly store: Store
	) {}

	public get isIncoming(): boolean {
		return (this.operation?.amount ?? 0) > 0;
	}

	public get relatedAccountId(): string {
		return this.operation?.relatedPaymentAccountId?.toString() ?? 'Unavailable';
	}

	public get relatedAccountLabel(): string {
		const relatedAccount = this.relatedAccount;
		return relatedAccount
			? `${relatedAccount.emitter} | ${relatedAccount.description}`
			: this.relatedAccountId;
	}

	public get transferAmount(): number {
		return Math.abs(this.operation?.amount ?? 0);
	}

	public get sourceAmount(): number {
		const multiplier = this.operation?.conversionMultiplier ?? 1;
		return this.isIncoming ? this.transferAmount / multiplier : this.transferAmount;
	}

	public get destinationAmount(): number {
		const multiplier = this.operation?.conversionMultiplier ?? 1;
		return this.isIncoming ? this.transferAmount : this.transferAmount * multiplier;
	}

	public get sourceAccountLabel(): string {
		return this.isIncoming ? this.relatedAccountLabel : this.activeAccountLabel;
	}

	public get destinationAccountLabel(): string {
		return this.isIncoming ? this.activeAccountLabel : this.relatedAccountLabel;
	}

	public get sourceCurrency(): string {
		return this.isIncoming ? this.relatedAccountCurrency : this.activeAccount?.currency ?? '';
	}

	public get destinationCurrency(): string {
		return this.isIncoming ? this.activeAccount?.currency ?? '' : this.relatedAccountCurrency;
	}

	public requestClose(): void {
		this.closeRequested.emit();
	}

	public deleteTransfer(): void {
		const operation = this.operation;
		const account = this.activeAccount;
		const accountId = account?.key;
		if (!operation || !accountId || this.isDeletingSignal()) {
			return;
		}

		this.dialog
			.open(TransferDeleteDialogComponent, {
				data: {
					amount: this.transferAmount,
					currency: account.currency,
					fromAccount: this.sourceAccountLabel,
					toAccount: this.destinationAccountLabel,
				},
				restoreFocus: true,
			})
			.afterClosed()
			.pipe(take(1))
			.subscribe(confirmed => {
				if (!confirmed) {
					return;
				}

				this.deleteErrorSignal.set('');
				this.isDeletingSignal.set(true);
				this.transferProvider
					.deleteById(accountId, operation.key)
					.pipe(
						take(1),
						finalize(() => this.isDeletingSignal.set(false))
					)
					.subscribe({
						next: response => {
							if (!response.isSucceeded) {
								this.deleteErrorSignal.set('Unable to delete this transfer. Please try again.');
								return;
							}

							this.deleted.emit();
						},
						error: () => this.deleteErrorSignal.set('Unable to delete this transfer. Please try again.'),
					});
			});
	}

	private get activeAccountLabel(): string {
		return this.activeAccount ? `${this.activeAccount.emitter} | ${this.activeAccount.description}` : 'Current account';
	}

	private get relatedAccountCurrency(): string {
		return this.relatedAccount?.currency ?? 'related account currency';
	}

	private get relatedAccount(): IPaymentAccountModel | undefined {
		const relatedAccountId = this.operation?.relatedPaymentAccountId;
		return relatedAccountId
			? this.paymentAccountsSignal().find(account => account.key?.equals(relatedAccountId) === true)
			: undefined;
	}
}
