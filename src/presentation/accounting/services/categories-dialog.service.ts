import { Injectable } from '@angular/core';
import { MatDialogConfig } from '@angular/material/dialog';

import { concatMap, map } from 'rxjs';

import { CategoriesDialogComponent } from '../../../app/modules/shared/components/dialog/categories/categories-dialog.component';
import { DialogContainer } from '../../../app/modules/shared/models/dialog-container';
import { DialogProvider } from '../../../app/modules/shared/providers/dialog-provider';
import { DefaultCategoriesProvider } from '../../../data/providers/accounting/categories.provider';
import { ICategoryModel } from '../../../domain/models/accounting/category.model';

@Injectable()
export class CategoriesDialogService {
	constructor(
		private readonly categoriesProvider: DefaultCategoriesProvider,
		private dialogProvider: DialogProvider
	) {}

	public openCategories(): void {
		const config = new MatDialogConfig<DialogContainer<ICategoryModel, ICategoryModel>>();

		const onSave = (payloadForSave: ICategoryModel) => {
			return this.categoriesProvider.saveCategory(payloadForSave.operationType, payloadForSave.nameNodes).pipe(
				map(responseResult => responseResult.payload),
				concatMap(categoryId => {
					return this.categoriesProvider.getCategoryById(categoryId);
				})
			);
		};

		config.data = {
			title: 'Budget categories:',
			onSubmit: onSave,
		} as DialogContainer<ICategoryModel, ICategoryModel>;

		config.disableClose = true;

		this.dialogProvider.openDialog(CategoriesDialogComponent, config);
	}
}
