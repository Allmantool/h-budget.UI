import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import {
	UntypedFormBuilder,
	UntypedFormControl,
	UntypedFormGroup,
} from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { BehaviorSubject, take } from 'rxjs';

import { DialogContainer } from '../../../../shared/models/dialog-container';

@Component({
	selector: 'dates-range-dialog',
	templateUrl: './dates-range-dialog.component.html',
	styleUrls: ['./dates-range-dialog.component.css'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DateRangeDialogComponent {
	private dialogConfiguration: DialogContainer;

	public isLoading$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(
		false
	);
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
		this.isLoading$.next(true);

		this.dialogConfiguration
			.onSubmit(this.dialogFg.value)
			.pipe(take(1))
			.subscribe((_) => {
				this.isLoading$.next(false);
				this.dialogRef.close();
			});
	}
}
