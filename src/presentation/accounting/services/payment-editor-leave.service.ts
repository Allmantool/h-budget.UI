import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

import { firstValueFrom } from 'rxjs';

import { PaymentDiscardDialogComponent } from '../components/payment-discard-dialog/payment-discard-dialog.component';

@Injectable()
export class PaymentEditorLeaveService {
	private canLeaveEditor?: () => Promise<boolean>;
	private pendingConfirmation?: Promise<boolean>;

	constructor(private readonly dialog: MatDialog) {}

	public register(canLeaveEditor: () => Promise<boolean>): () => void {
		this.canLeaveEditor = canLeaveEditor;
		return () => {
			if (this.canLeaveEditor === canLeaveEditor) {
				this.canLeaveEditor = undefined;
			}
		};
	}

	public canLeave(): Promise<boolean> {
		return this.canLeaveEditor?.() ?? Promise.resolve(true);
	}

	public confirmDiscard(): Promise<boolean> {
		if (!this.pendingConfirmation) {
			this.pendingConfirmation = firstValueFrom(
				this.dialog
					.open<PaymentDiscardDialogComponent, undefined, boolean>(PaymentDiscardDialogComponent, {
						disableClose: false,
						restoreFocus: true,
					})
					.afterClosed()
			).then(result => result === true);
			this.pendingConfirmation.finally(() => {
				this.pendingConfirmation = undefined;
			});
		}

		return this.pendingConfirmation;
	}
}
