import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

import { finalize, take } from 'rxjs';

import { IPaymentAccountModel } from '../../../../domain/models/accounting/payment-account.model';
import { PaymentAccountDeleteDialogData } from '../../models/payment-account-delete-dialog-data';

@Component({
	selector: 'payment-account-delete-dialog',
	templateUrl: './payment-account-delete-dialog.component.html',
	styleUrls: ['./payment-account-delete-dialog.component.css'],
	changeDetection: ChangeDetectionStrategy.OnPush,
	standalone: true,
	imports: [DecimalPipe, MatButtonModule, MatDialogModule],
})
export class PaymentAccountDeleteDialogComponent {
	private readonly destroyRef = inject(DestroyRef);
	private readonly dialogRef =
		inject<MatDialogRef<PaymentAccountDeleteDialogComponent, IPaymentAccountModel>>(MatDialogRef);
	public readonly data = inject<PaymentAccountDeleteDialogData>(MAT_DIALOG_DATA);
	public readonly isDeletingSignal = signal(false);
	public readonly errorMessageSignal = signal('');

	public confirm(): void {
		if (this.isDeletingSignal()) {
			return;
		}

		this.isDeletingSignal.set(true);
		this.errorMessageSignal.set('');
		this.dialogRef.disableClose = true;

		this.data
			.deleteAccount()
			.pipe(
				take(1),
				finalize(() => {
					this.isDeletingSignal.set(false);
					this.dialogRef.disableClose = false;
				}),
				takeUntilDestroyed(this.destroyRef)
			)
			.subscribe({
				next: () => this.dialogRef.close(this.data.account),
				error: (error: unknown) => this.errorMessageSignal.set(this.errorMessage(error)),
			});
	}

	private errorMessage(error: unknown): string {
		return error instanceof Error && error.message
			? error.message
			: 'This account could not be deleted. Try again.';
	}
}
