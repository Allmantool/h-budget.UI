import { ChangeDetectionStrategy, Component, Inject, signal } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { take } from 'rxjs';

import { DialogContainer } from '../../../../shared/models/dialog-container';

@Component({
	selector: 'dates-range-dialog',
	templateUrl: './dates-range-dialog.component.html',
	styleUrls: ['./dates-range-dialog.component.css'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DateRangeDialogComponent {
	private dialogConfiguration: DialogContainer;
	public isLoadingSignal = signal<boolean>(false);
	public dialogFg: UntypedFormGroup;
	public title: string;

	constructor(
		private dialogRef: MatDialogRef<DateRangeDialogComponent>,
		fb: UntypedFormBuilder,
		@Inject(MAT_DIALOG_DATA) dialogConfiguration: DialogContainer
	) {
		this.dialogFg = fb.group({
			startDate: new UntypedFormControl(new Date()),
			endDate: new UntypedFormControl(new Date()),
		});

		this.title = dialogConfiguration.title;
		this.dialogConfiguration = dialogConfiguration;
	}

	public close() {
		this.dialogRef.close();
	}

	public getRates(): void {
		this.isLoadingSignal.set(true);

		this.dialogConfiguration
			.onSubmit(this.dialogFg.value)
			.pipe(take(1))
			.subscribe((_) => {
				this.isLoadingSignal.set(false);
				this.dialogRef.close();
			});
	}
}
