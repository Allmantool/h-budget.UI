/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { ChangeDetectionStrategy, Component, ElementRef, Inject, ViewChild, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ENTER } from '@angular/cdk/keycodes';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatChipInputEvent } from '@angular/material/chips';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { Observable, startWith, filter, map, take } from 'rxjs';
import * as _ from 'lodash';

import { DialogContainer } from '../../../models/dialog-container';
import { Result } from 'core/result';
import { ContractorModel } from 'domain/models/accounting/contractor.model.';
import { Store } from '@ngxs/store';
import { AddCounterParty } from '../../../store/states/handbooks/actions/counterparty.actions';

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

	public isLoadingSignal = signal<boolean>(false);

	public isSaveDisabled: boolean = true;

	public title: string;

	public partyNodes: string[] = [];
	public filteredPartyNodes$: Observable<string[]>;

	public readonly separatorKeysCodes: number[] = [ENTER];

	public dialogFg: UntypedFormGroup;

	constructor(
		private readonly store: Store,
		private readonly fb: UntypedFormBuilder,
		private dialogRef: MatDialogRef<CounterpartiesDialogComponent>,
		@Inject(MAT_DIALOG_DATA) dialogConfiguration: DialogContainer
	) {
		this.title = dialogConfiguration.title;
		this.dialogConfiguration = dialogConfiguration;

		this.dialogFg = this.fb.group({
			partyCtrl: new UntypedFormControl(''),
		});

		this.filteredPartyNodes$ = this.dialogFg.controls['partyCtrl'].valueChanges.pipe(
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
		this.isLoadingSignal.set(true);

		if (_.isEmpty(this.partyNodes)) {
			this.dialogRef.close();
			return;
		}

		this.dialogConfiguration
			.onSubmit({ nameNodes: this.partyNodes } as ContractorModel)
			.pipe(take(1))
			.subscribe(response => {
				this.store.dispatch(new AddCounterParty(response));

				this.isLoadingSignal.set(false);
				this.dialogRef.close();
			});
	}

	public add(event: MatChipInputEvent): void {
		const value = (event.value || '').trim();

		if (!_.isNil(value)) {
			this.partyNodes.push(value);
		}

		event.chipInput.clear();

		this.dialogFg.controls['partyCtrl'].setValue(null);

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
		this.dialogFg.controls['partyCtrl'].setValue(null);
	}
}
