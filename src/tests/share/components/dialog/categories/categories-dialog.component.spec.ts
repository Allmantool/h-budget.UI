/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { ElementRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatChipInput, MatChipInputEvent } from '@angular/material/chips';
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
import { PaymentOperationTypes } from '../../../../../domain/models/accounting/operation-types';
import { CategoriesDialogService } from '../../../../../presentation/accounting/services/categories-dialog.service';

describe('categories-dialog.component', () => {
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
			getCategoryById: () =>
				of<ICategoryModel>({
					key: Guid.parse(''),
					operationType: PaymentOperationTypes.Expense,
					nameNodes: [],
				} as ICategoryModel),
			saveCategory: () =>
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

	it('"DialogProvider" open dialog should be execute at least ones when call "getCategoryTypes()"', () => {
		sut.openCategories();

		const componentUnderTest = TestBed.inject(CategoriesDialogComponent);

		componentUnderTest.getCategoryTypes();

		expect(dialogProviderSpy.openDialog).toHaveBeenCalled();
	});

	it('"DialogProvider" open dialog should be execute at least ones when call "close()"', () => {
		sut.openCategories();

		const componentUnderTest = TestBed.inject(CategoriesDialogComponent);

		componentUnderTest.close();

		expect(dialogProviderSpy.openDialog).toHaveBeenCalled();
	});

	it('"DialogProvider" open dialog should be execute at least ones when call "save()"', () => {
		sut.openCategories();

		const componentUnderTest = TestBed.inject(CategoriesDialogComponent);

		componentUnderTest.save();

		expect(dialogProviderSpy.openDialog).toHaveBeenCalled();
	});

	it('"DialogProvider" open dialog should be execute at least ones when call "add()"', () => {
		sut.openCategories();

		const componentUnderTest = TestBed.inject(CategoriesDialogComponent);

		componentUnderTest.add({
			value: 'input value',
			chipInput: {
				clear: () => {},
			} as MatChipInput,
		} as MatChipInputEvent);

		expect(dialogProviderSpy.openDialog).toHaveBeenCalled();
	});

	it('"DialogProvider" open dialog should be execute at least ones when call "remove()"', () => {
		sut.openCategories();

		const componentUnderTest = TestBed.inject(CategoriesDialogComponent);

		componentUnderTest.remove('note-to-remove');

		expect(dialogProviderSpy.openDialog).toHaveBeenCalled();
	});

	it('"DialogProvider" open dialog should be execute at least ones when call "selected()"', () => {
		sut.openCategories();

		const componentUnderTest = TestBed.inject(CategoriesDialogComponent);

		componentUnderTest.chipGrid = {
			nativeElement: {
				value: 'grid input value',
			} as HTMLInputElement,
		} as ElementRef<HTMLInputElement>;

		componentUnderTest.selected({
			option: {
				viewValue: 'test value for category nodes',
			},
		} as MatAutocompleteSelectedEvent);

		expect(dialogProviderSpy.openDialog).toHaveBeenCalled();
	});
});
