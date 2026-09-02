import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';

@Component({
	selector: 'payment-discard-dialog',
	templateUrl: './payment-discard-dialog.component.html',
	styleUrls: ['./payment-discard-dialog.component.css'],
	changeDetection: ChangeDetectionStrategy.OnPush,
	standalone: true,
	imports: [MatButtonModule, MatDialogModule],
})
export class PaymentDiscardDialogComponent {
	constructor(private readonly dialogRef: MatDialogRef<PaymentDiscardDialogComponent, boolean>) {}

	public discard(): void {
		this.dialogRef.close(true);
	}
}
