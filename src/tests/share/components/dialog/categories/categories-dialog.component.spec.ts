/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { NgxsModule } from '@ngxs/store';
import { of } from 'rxjs';
import { Guid } from 'typescript-guid';

import { AppCoreModule } from '../../../../../app/modules/core/core.module';
import { AngularMaterailSharedModule } from '../../../../../app/modules/shared/angular-material.shared.module';
import { CategoriesDialogComponent } from '../../../../../app/modules/shared/components/dialog/categories/categories-dialog.component';
import { CustomUIComponentsSharedModule } from '../../../../../app/modules/shared/custom-ui-components.shared.module';
import { DialogContainer } from '../../../../../app/modules/shared/models/dialog-container';
import { DialogProvider } from '../../../../../app/modules/shared/providers/dialog-provider';
import { AppSharedModule } from '../../../../../app/modules/shared/shared.module';
import { ngxsConfig } from '../../../../../app/modules/shared/store/ngxs.config';
import { CategoriesState } from '../../../../../app/modules/shared/store/states/handbooks/categories.state';
import { Result } from '../../../../../core/result';
import { DefaultCategoriesProvider } from '../../../../../data/providers/accounting/categories.provider';
import { ICategoryEntity } from '../../../../../data/providers/accounting/entities/operation-category.entity';
import { ICategoryModel } from '../../../../../domain/models/accounting/category.model';
import { OperationTypes } from '../../../../../domain/models/accounting/operation-types';
import { CategoriesDialogService } from '../../../../../presentation/accounting/services/categories-dialog.service';

describe('Categories-dialog.component', () => {
	const matDialogSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

	const mockDialogContainer: DialogContainer<ICategoryModel, ICategoryModel> = {
		title: 'Categories dialog test',
		onSubmit: (payload: ICategoryModel) => of(payload),
	};

	let categoriesProviderSpy: jasmine.SpyObj<DefaultCategoriesProvider>;
	let dialogProviderSpy: jasmine.SpyObj<DialogProvider>;

	let sut: CategoriesDialogService;

	beforeEach(() => {
		dialogProviderSpy = jasmine.createSpyObj('dialogProvider', ['openDialog']);

		categoriesProviderSpy = jasmine.createSpyObj('categoriesProvider', {
			getCategoriries: () =>
				of(
					new Result<ICategoryEntity[]>({
						payload: [{} as ICategoryEntity],
					})
				),
			getCategoryById: (categoryId: string) =>
				of<ICategoryModel>({
					key: Guid.parse(''),
					operationType: OperationTypes.Expense,
					nameNodes: [],
				} as ICategoryModel),
			saveCategory: (operationType: number, newCategoryNamesNodes: string[]) =>
				of<Result<string>>(
					new Result({
						payload: 'bb6d182f-8b99-4e09-aa24-319b181178e3',
					})
				),
		});

		TestBed.configureTestingModule({
			imports: [
				AppCoreModule,
				AngularMaterailSharedModule,
				CustomUIComponentsSharedModule,
				AppSharedModule,
				NgxsModule.forRoot([CategoriesState], ngxsConfig),
			],
			providers: [
				CategoriesDialogComponent,
				CategoriesDialogService,
				{
					provide: MatDialogRef,
					useValue: matDialogSpy,
				},

				{
					provide: MAT_DIALOG_DATA,
					useValue: mockDialogContainer,
				},
				{
					provide: DialogProvider,
					useValue: dialogProviderSpy,
				},
				{
					provide: DefaultCategoriesProvider,
					useValue: categoriesProviderSpy,
				},
			],
		});

		sut = TestBed.inject(CategoriesDialogService);
	});

	it('"DialogProvider" should be execute at least ones', () => {
		sut.openCategories();

		const componentUnderTest = TestBed.inject(CategoriesDialogComponent);

		componentUnderTest.save();

		expect(dialogProviderSpy.openDialog).toHaveBeenCalled();
	});
});
