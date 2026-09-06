import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

interface PaymentDeleteDialogData {
	amount: number;
	category: string;
	currency: string;
	date: string;
	payee: string;
}

@Component({
	selector: 'payment-delete-dialog',
	templateUrl: './payment-delete-dialog.component.html',
	styleUrls: ['./payment-delete-dialog.component.css'],
	changeDetection: ChangeDetectionStrategy.OnPush,
	standalone: true,
	imports: [DecimalPipe, MatButtonModule, MatDialogModule],
})
export class PaymentDeleteDialogComponent {
	constructor(
		private readonly dialogRef: MatDialogRef<PaymentDeleteDialogComponent>,
		@Inject(MAT_DIALOG_DATA) public readonly data: PaymentDeleteDialogData
	) {}

	public confirm(): void {
		this.dialogRef.close(true);
	}
}
