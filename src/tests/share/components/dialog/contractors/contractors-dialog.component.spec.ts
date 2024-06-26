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

import { Result } from 'core/result';

import { AppCoreModule } from '../../../../../app/modules/core/core.module';
import { AngularMaterialSharedModule } from '../../../../../app/modules/shared/angular-material.shared.module';
import { ContractorsDialogComponent } from '../../../../../app/modules/shared/components/dialog/contractors/contractors-dialog.component';
import { CustomUIComponentsSharedModule } from '../../../../../app/modules/shared/custom-ui-components.shared.module';
import { DialogContainer } from '../../../../../app/modules/shared/models/dialog-container';
import { DialogProvider } from '../../../../../app/modules/shared/providers/dialog-provider';
import { AppSharedModule } from '../../../../../app/modules/shared/shared.module';
import { ngxsConfig } from '../../../../../app/modules/shared/store/ngxs.config';
import { ContractorsState } from '../../../../../app/modules/shared/store/states/handbooks/contractors.state';
import { DefaultContractorsProvider } from '../../../../../data/providers/accounting/contractors.provider';
import { ICategoryEntity } from '../../../../../data/providers/accounting/entities/operation-category.entity';
import { IContractorModel } from '../../../../../domain/models/accounting/contractor.model.';
import { ContractorsDialogService } from '../../../../../presentation/accounting/services/contractors-dialog.service';

describe('contractors-dialog.component', () => {
	const matDialogSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

	const mockDialogContainer: DialogContainer<IContractorModel, IContractorModel> = {
		title: 'Contractor dialog tets',
		onSubmit: (payload: IContractorModel) => of(payload),
	};

	let contractorsProviderSpy: jasmine.SpyObj<DefaultContractorsProvider>;
	let dialogProviderSpy: jasmine.SpyObj<DialogProvider>;

	let sut: ContractorsDialogService;

	beforeEach(() => {
		dialogProviderSpy = jasmine.createSpyObj('dialogProvider', ['openDialog']);

		contractorsProviderSpy = jasmine.createSpyObj('contractorsProvider', {
			getContractors: () =>
				of(
					new Result<ICategoryEntity[]>({
						payload: [{} as ICategoryEntity],
					})
				),
			getContractorById: () =>
				of<IContractorModel>({
					key: Guid.parse(''),
				} as IContractorModel),
			saveContractor: () =>
				of<Result<string>>(
					new Result({
						payload: 'bb6d182f-8b99-4e09-aa24-319b181178e3',
					})
				),
		});

		TestBed.configureTestingModule({
			imports: [
				AppCoreModule,
				AngularMaterialSharedModule,
				CustomUIComponentsSharedModule,
				AppSharedModule,
				NgxsModule.forRoot([ContractorsState], ngxsConfig),
			],
			providers: [
				ContractorsDialogComponent,
				ContractorsDialogService,
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
					provide: DefaultContractorsProvider,
					useValue: contractorsProviderSpy,
				},
			],
		});

		sut = TestBed.inject(ContractorsDialogService);
	});

	it('"DialogProvider" should be execute at least ones', () => {
		sut.openContractors();

		const componentUnderTest = TestBed.inject(ContractorsDialogComponent);

		componentUnderTest.save();

		expect(dialogProviderSpy.openDialog).toHaveBeenCalled();
	});

	it('"DialogProvider" open dialog should be execute at least ones when call "close()"', () => {
		sut.openContractors();

		const componentUnderTest = TestBed.inject(ContractorsDialogComponent);

		componentUnderTest.close();

		expect(dialogProviderSpy.openDialog).toHaveBeenCalled();
	});

	it('"DialogProvider" open dialog should be execute at least ones when call "save()"', () => {
		sut.openContractors();

		const componentUnderTest = TestBed.inject(ContractorsDialogComponent);

		componentUnderTest.save();

		expect(dialogProviderSpy.openDialog).toHaveBeenCalled();
	});

	it('"DialogProvider" open dialog should be execute at least ones when call "add()"', () => {
		sut.openContractors();

		const componentUnderTest = TestBed.inject(ContractorsDialogComponent);

		componentUnderTest.add({
			value: 'input value',
			chipInput: {
				clear: () => {},
			} as MatChipInput,
		} as MatChipInputEvent);

		expect(dialogProviderSpy.openDialog).toHaveBeenCalled();
	});

	it('"DialogProvider" open dialog should be execute at least ones when call "remove()"', () => {
		sut.openContractors();

		const componentUnderTest = TestBed.inject(ContractorsDialogComponent);

		componentUnderTest.remove('note-to-remove');

		expect(dialogProviderSpy.openDialog).toHaveBeenCalled();
	});

	it('"DialogProvider" open dialog should be execute at least ones when call "selected()"', () => {
		sut.openContractors();

		const componentUnderTest = TestBed.inject(ContractorsDialogComponent);

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
