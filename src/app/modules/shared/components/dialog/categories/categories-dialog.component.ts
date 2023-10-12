import {
	ChangeDetectionStrategy,
	Component,
	ElementRef,
	Inject,
	OnDestroy,
	ViewChild,
} from '@angular/core';
import { ENTER } from '@angular/cdk/keycodes';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatChipInputEvent } from '@angular/material/chips';
import {
	FormControl,
	UntypedFormBuilder,
	UntypedFormControl,
	UntypedFormGroup,
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { BehaviorSubject, Observable, startWith, take, map, Subject } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import * as _ from 'lodash';

import { DialogContainer } from '../../../models/dialog-container';
import { Result } from 'core/result';
import { OperationTypes } from 'domain/models/accounting/operation-types';
import { OperationCategory } from '../../../../../../domain/models/accounting/operation-category';

@Component({
	selector: 'categories-dialog',
	templateUrl: './categories-dialog.component.html',
	styleUrls: ['./categories-dialog.component.css'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoriesDialogComponent implements OnDestroy {
	private destroy$ = new Subject<void>();

	private dialogConfiguration: DialogContainer;

	@ViewChild('chipGrid ')
	chipGrid!: ElementRef<HTMLInputElement>;

	public isLoading$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

	public isSaveDisabled: boolean = true;

	public dialogFg: UntypedFormGroup;
	public title: string;

	public categoryNodes: string[] = [];
	public filteredCategoryNodes$!: Observable<string[]>;

	public readonly separatorKeysCodes: number[] = [ENTER];
	public categoryCtrl = new FormControl('');

	constructor(
		private dialogRef: MatDialogRef<CategoriesDialogComponent>,
		fb: UntypedFormBuilder,
		@Inject(MAT_DIALOG_DATA) dialogConfiguration: DialogContainer
	) {
		this.dialogFg = fb.group({
			categoryType: new UntypedFormControl(OperationTypes[OperationTypes.Income]),
		});

		this.title = dialogConfiguration.title;
		this.dialogConfiguration = dialogConfiguration;

		this.filteredCategoryNodes$ = this.categoryCtrl.valueChanges.pipe(
			takeUntilDestroyed(),
			startWith(null),
			map((categoryNode: string | null) =>
				categoryNode
					? _.filter(this.categoryNodes, categoryNode)
					: this.categoryNodes.slice()
			)
		);
	}
	ngOnDestroy(): void {
		this.destroy$.next();
		this.destroy$.complete();
	}

	public close() {
		this.dialogRef.close();
	}

	public getCategoryTypes(): string[] {
		return Object.keys(OperationTypes).filter((v) => isNaN(Number(v)));
	}

	public save(): void {
		this.isLoading$.next(true);

		if (_.isEmpty(this.categoryNodes)) {
			this.dialogRef.close();
			return;
		}

		const categoryType = this.dialogFg.controls['categoryType'].value as string;

		const payloadForSave = {
			type: OperationTypes[categoryType as keyof typeof OperationTypes],
			value: JSON.stringify(this.categoryNodes),
		} as OperationCategory;

		this.dialogConfiguration
			.onSubmit(
				new Result<OperationCategory>({
					payload: payloadForSave,
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
