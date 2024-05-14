import { ENTER } from '@angular/cdk/keycodes';
import { ChangeDetectionStrategy, Component, ElementRef, Inject, signal, ViewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, UntypedFormBuilder, UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatChipInputEvent } from '@angular/material/chips';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import * as _ from 'lodash';

import { Store } from '@ngxs/store';
import { map, Observable, startWith, take } from 'rxjs';

import { ICategoryModel } from '../../../../../../domain/models/accounting/category.model';
import { PaymentOperationTypes } from '../../../../../../domain/models/accounting/operation-types';
import { DialogContainer } from '../../../models/dialog-container';
import { AddCategory } from '../../../store/states/handbooks/actions/category.actions';

@Component({
	selector: 'categories-dialog',
	templateUrl: './categories-dialog.component.html',
	styleUrls: ['./categories-dialog.component.css'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoriesDialogComponent {
	private dialogConfiguration: DialogContainer<ICategoryModel, ICategoryModel>;

	@ViewChild('chipGrid')
	chipGrid!: ElementRef<HTMLInputElement>;

	public isLoadingSignal = signal<boolean>(false);

	public isSaveDisabled: boolean = true;

	public dialogFg: UntypedFormGroup;
	public title: string;

	public categoryNodes: string[] = [];
	public filteredCategoryNodes$!: Observable<string[]>;

	public readonly separatorKeysCodes: number[] = [ENTER];
	public categoryCtrl = new FormControl('');

	constructor(
		private readonly store: Store,
		private dialogRef: MatDialogRef<CategoriesDialogComponent>,
		fb: UntypedFormBuilder,
		@Inject(MAT_DIALOG_DATA) dialogConfiguration: DialogContainer<ICategoryModel, ICategoryModel>
	) {
		this.dialogFg = fb.group({
			categoryType: new UntypedFormControl(PaymentOperationTypes[PaymentOperationTypes.Income]),
		});

		this.title = dialogConfiguration.title;
		this.dialogConfiguration = dialogConfiguration;

		this.filteredCategoryNodes$ = this.categoryCtrl.valueChanges.pipe(
			takeUntilDestroyed(),
			startWith(null),
			map((categoryNode: string | null) =>
				categoryNode ? _.filter(this.categoryNodes, categoryNode) : this.categoryNodes.slice()
			)
		);
	}

	public close() {
		this.dialogRef.close();
	}

	public getCategoryTypes(): string[] {
		return Object.keys(PaymentOperationTypes).filter(v => isNaN(Number(v)));
	}

	public save(): void {
		this.isLoadingSignal.set(true);

		if (_.isEmpty(this.categoryNodes)) {
			this.dialogRef.close();
			return;
		}

		const categoryType = this.dialogFg.controls['categoryType'].value as string;

		const payloadForSave = {
			operationType: PaymentOperationTypes[categoryType as keyof typeof PaymentOperationTypes],
			nameNodes: this.categoryNodes,
		} as ICategoryModel;

		this.dialogConfiguration
			.onSubmit(payloadForSave)
			.pipe(take(1))
			.subscribe(response => {
				this.store.dispatch(new AddCategory(response));

				this.isLoadingSignal.set(false);
				this.dialogRef.close();
			});
	}

	public add(event: MatChipInputEvent): void {
		const value = (event.value || '').trim();

		if (!_.isNil(value)) {
			this.categoryNodes.push(value);
		}

		event.chipInput.clear();

		this.categoryCtrl.setValue(null);
		this.isSaveDisabled = _.isEmpty(this.categoryNodes);
	}

	public remove(categoryNode: string): void {
		const index = this.categoryNodes.indexOf(categoryNode);

		if (index >= 0) {
			this.categoryNodes.splice(index, 1);
		}

		this.isSaveDisabled = _.isEmpty(this.categoryNodes);
	}

	public selected(event: MatAutocompleteSelectedEvent): void {
		this.categoryNodes.push(event.option.viewValue);
		this.chipGrid.nativeElement.value = '';
		this.categoryCtrl.setValue(null);
	}
}
