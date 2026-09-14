import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

interface TransferDeleteDialogData {
	amount: number;
	currency: string;
	fromAccount: string;
	toAccount: string;
}

@Component({
	selector: 'transfer-delete-dialog',
	templateUrl: './transfer-delete-dialog.component.html',
	styleUrls: ['./transfer-delete-dialog.component.css'],
	changeDetection: ChangeDetectionStrategy.OnPush,
	standalone: true,
	imports: [DecimalPipe, MatButtonModule, MatDialogModule],
})
export class TransferDeleteDialogComponent {
	constructor(
		private readonly dialogRef: MatDialogRef<TransferDeleteDialogComponent>,
		@Inject(MAT_DIALOG_DATA) public readonly data: TransferDeleteDialogData
	) {}

	public confirm(): void {
		this.dialogRef.close(true);
	}
}
