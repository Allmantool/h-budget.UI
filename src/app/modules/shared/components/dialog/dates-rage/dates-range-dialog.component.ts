/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ChangeDetectionStrategy, Component, Inject, signal } from '@angular/core';
import { ReactiveFormsModule, UntypedFormBuilder, UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

import { take } from 'rxjs';

import { DialogContainer } from '../../../../shared/models/dialog-container';
import { DatepickerComponent } from '../../datepicker/app-datepicker.component';
import { ProgressBarComponent } from '../../progress-bar/progress-bar.component';

@Component({
	selector: 'dates-range-dialog',
	templateUrl: './dates-range-dialog.component.html',
	styleUrls: ['./dates-range-dialog.component.css'],
	changeDetection: ChangeDetectionStrategy.OnPush,
	standalone: true,
	imports: [DatepickerComponent, MatButtonModule, MatDialogModule, ProgressBarComponent, ReactiveFormsModule],
})
export class DateRangeDialogComponent {
	private dialogConfiguration: DialogContainer<any, any>;
	public isLoadingSignal = signal<boolean>(false);
	public dialogFg: UntypedFormGroup;
	public title: string;

	constructor(
		private readonly dialogRef: MatDialogRef<DateRangeDialogComponent>,
		private readonly fb: UntypedFormBuilder,
		@Inject(MAT_DIALOG_DATA) dialogConfiguration: DialogContainer<any, any>
	) {
		this.dialogFg = this.fb.group({
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
			.subscribe(_ => {
				this.isLoadingSignal.set(false);
				this.dialogRef.close();
			});
	}
}
