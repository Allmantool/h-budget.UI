import { ChangeDetectionStrategy, Component, ElementRef, Inject, ViewChild } from '@angular/core';
import { ENTER } from '@angular/cdk/keycodes';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatChipInputEvent } from '@angular/material/chips';
import { FormControl } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { BehaviorSubject, Observable, startWith, take, map } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import * as _ from 'lodash';

import { DialogContainer } from '../../../models/dialog-container';
import { Result } from 'core/result';

@Component({
	selector: 'counterparties-dialog',
	templateUrl: './counterparties-dialog.component.html',
	styleUrls: ['./counterparties-dialog.component.css'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CounterpartiesDialogComponent {
	private dialogConfiguration: DialogContainer;

	@ViewChild('chipGrid ')
	chipGrid!: ElementRef<HTMLInputElement>;

	public isLoading$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

	public isSaveDisabled: boolean = true;

	public title: string;

	public partyNodes: string[] = [];
	public filteredPartyNodes$: Observable<string[]>;

	public readonly separatorKeysCodes: number[] = [ENTER];
	public partyCtrl = new FormControl('');

	constructor(
		private dialogRef: MatDialogRef<CounterpartiesDialogComponent>,
		@Inject(MAT_DIALOG_DATA) dialogConfiguration: DialogContainer
	) {
		this.title = dialogConfiguration.title;
		this.dialogConfiguration = dialogConfiguration;

		this.filteredPartyNodes$ = this.partyCtrl.valueChanges.pipe(
			takeUntilDestroyed(),
			startWith(null),
			map((partyNode: string | null) =>
				partyNode ? _.filter(this.partyNodes, partyNode) : this.partyNodes.slice()
			)
		);
	}

	public close() {
		this.dialogRef.close();
	}

	public save(): void {
		this.isLoading$.next(true);

		if (_.isEmpty(this.partyNodes)) {
			this.dialogRef.close();
			return;
		}

		this.dialogConfiguration
			.onSubmit(
				new Result<string>({
					payload: JSON.stringify(this.partyNodes),
					isSucceeded: true,
				})
			)
			.pipe(take(1))
			.subscribe((_) => {
				this.isLoading$.next(false);
				this.dialogRef.close();
			});
	}

	public add(event: MatChipInputEvent): void {
		const value = (event.value || '').trim();

		if (!_.isNil(value)) {
			this.partyNodes.push(value);
		}

		event.chipInput.clear();

		this.partyCtrl.setValue(null);

		this.isSaveDisabled = _.isEmpty(this.partyNodes);
	}

	public remove(partyNode: string): void {
		const index = this.partyNodes.indexOf(partyNode);

		if (index >= 0) {
			this.partyNodes.splice(index, 1);
		}

		this.isSaveDisabled = _.isEmpty(this.partyNodes);
	}

	public selected(event: MatAutocompleteSelectedEvent): void {
		this.partyNodes.push(event.option.viewValue);
		this.chipGrid.nativeElement.value = '';
		this.partyCtrl.setValue(null);
	}
}
