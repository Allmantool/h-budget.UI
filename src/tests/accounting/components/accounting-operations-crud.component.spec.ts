import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { MatDatepicker } from '@angular/material/datepicker';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { NgxsModule, Store } from '@ngxs/store';
import { Guid } from 'typescript-guid';

import { ngxsConfig } from '../../../app/modules/shared/store/ngxs.config';
import { AccountingOperationsTableState } from '../../../app/modules/shared/store/states/accounting/accounting-operations-table.state';
import { SetActiveAccountingOperation } from '../../../app/modules/shared/store/states/accounting/actions/accounting-table-options.actions';
import { SetActivePaymentAccount } from '../../../app/modules/shared/store/states/accounting/actions/payment-account.actions';
import { SetInitialPaymentOperations } from '../../../app/modules/shared/store/states/accounting/actions/payment-operation.actions';
import { SetInitialCategories } from '../../../app/modules/shared/store/states/handbooks/actions/category.actions';
import { PaymentAccountState } from '../../../app/modules/shared/store/states/accounting/payment-account.state';
import { AccountingOperationsState } from '../../../app/modules/shared/store/states/accounting/payment-operations.state';
import { getAccountingTableOptions } from '../../../app/modules/shared/store/states/accounting/selectors/table-options.selectors';
import { CategoriesState } from '../../../app/modules/shared/store/states/handbooks/categories.state';
import { ContractorsState } from '../../../app/modules/shared/store/states/handbooks/contractors.state';
import { AccountingOperationsCrudComponent } from '../../../presentation/accounting/components/accounting-operations-crud/accounting-operations-crud.component';
import { CategoriesDialogService } from '../../../presentation/accounting/services/categories-dialog.service';
import { ContractorsDialogService } from '../../../presentation/accounting/services/contractors-dialog.service';
import { PaymentCommandExecutorService } from '../../../presentation/accounting/services/payment-command-executor.service';
import { PaymentEditorLeaveService } from '../../../presentation/accounting/services/payment-editor-leave.service';
import { PaymentEditorSessionService } from '../../../presentation/accounting/services/payment-editor-session.service';
import { OperationTypes } from '../../../domain/types/operation.types';
import { PaymentOperationTypes } from '../../../domain/models/accounting/operation-types';
import { IPaymentOperationModel } from '../../../domain/models/accounting/payment-operation.model';

describe('accounting operations CRUD component', () => {
	it('renders one create primary action and prevents concurrent submission', async () => {
		const write = jasmine.createSpy('executeCreate').and.returnValue(new Promise(() => undefined));
		await TestBed.configureTestingModule({
			imports: [
				AccountingOperationsCrudComponent,
				NoopAnimationsModule,
				NgxsModule.forRoot(
					[
						AccountingOperationsState,
						AccountingOperationsTableState,
						PaymentAccountState,
						CategoriesState,
						ContractorsState,
					],
					ngxsConfig
				),
			],
			providers: [
				{
					provide: PaymentCommandExecutorService,
					useValue: { executeCreate: write },
				},
				{ provide: CategoriesDialogService, useValue: { openCategories: jasmine.createSpy() } },
				{ provide: ContractorsDialogService, useValue: { openContractors: jasmine.createSpy() } },
				{ provide: PaymentEditorLeaveService, useValue: createLeaveService() },
				PaymentEditorSessionService,
			],
		}).compileComponents();
		const store = TestBed.inject(Store);
		store.dispatch(new SetActivePaymentAccount('1c12ec59-8875-45c1-9fb0-e4edcf34a074'));
		const fixture: ComponentFixture<AccountingOperationsCrudComponent> = TestBed.createComponent(
			AccountingOperationsCrudComponent
		);
		fixture.detectChanges();
		const component = fixture.componentInstance;
		const categoryId = Guid.create().toString();
		component.paymentForm.patchValue({ amount: 10, categoryId });

		void component.submitAsync();
		void component.submitAsync();

		expect(write).toHaveBeenCalledTimes(1);
		const nativeElement: unknown = fixture.nativeElement;
		if (!(nativeElement instanceof HTMLElement)) {
			throw new Error('Expected the fixture to render an HTMLElement.');
		}
		expect(nativeElement.textContent).toContain('Create payment');
		expect(nativeElement.querySelector('mat-datepicker-toggle')).not.toBeNull();
	});

	it('retains an uncertain intent and offers the user an explicit retry', async () => {
		const executeCreate = jasmine.createSpy('executeCreate').and.resolveTo({
			status: 'unknown',
			intent: {
				action: 'create',
				accountId: '1c12ec59-8875-45c1-9fb0-e4edcf34a074',
				idempotencyKey: 'intent-key',
				requestFingerprint: 'fingerprint',
			},
			message: "We couldn't confirm whether this payment was accepted. Retry to check its status.",
		});
		await TestBed.configureTestingModule({
			imports: [
				AccountingOperationsCrudComponent,
				NoopAnimationsModule,
				NgxsModule.forRoot(
					[
						AccountingOperationsState,
						AccountingOperationsTableState,
						PaymentAccountState,
						CategoriesState,
						ContractorsState,
					],
					ngxsConfig
				),
			],
			providers: [
				{ provide: PaymentCommandExecutorService, useValue: { executeCreate } },
				{ provide: CategoriesDialogService, useValue: { openCategories: jasmine.createSpy() } },
				{ provide: ContractorsDialogService, useValue: { openContractors: jasmine.createSpy() } },
				{ provide: PaymentEditorLeaveService, useValue: createLeaveService() },
				PaymentEditorSessionService,
			],
		}).compileComponents();
		const store = TestBed.inject(Store);
		store.dispatch(new SetActivePaymentAccount('1c12ec59-8875-45c1-9fb0-e4edcf34a074'));
		const fixture = TestBed.createComponent(AccountingOperationsCrudComponent);
		fixture.detectChanges();
		const component = fixture.componentInstance;
		const categoryId = Guid.create().toString();
		component.paymentForm.patchValue({ amount: 10, categoryId });

		await component.submitAsync();
		fixture.detectChanges();

		expect(component.submissionStateSignal().status).toBe('uncertain');
		expect(component.isSubmittingSignal()).toBeFalse();
		expect((fixture.nativeElement as HTMLElement).textContent).toContain('Retry saving');

		component.cancel();
		component.paymentForm.patchValue({ amount: 10, categoryId });
		await component.submitAsync();

		expect(executeCreate.calls.argsFor(1)[1]).toEqual(jasmine.objectContaining({ idempotencyKey: 'intent-key' }));
	});

	it('allows sequential projected creates without selecting either new payment', async () => {
		const createdOperationId = '1932b129-a5ca-4bbd-b0f9-4682720e25d9';
		const secondCreatedOperationId = '5a4ab9fd-3128-43b6-ab4d-47c55a25c7cf';
		const executeCreate = jasmine
			.createSpy('executeCreate')
			.and.returnValues(
				Promise.resolve({ status: 'projected', paymentOperationId: createdOperationId }),
				Promise.resolve({ status: 'projected', paymentOperationId: secondCreatedOperationId })
			);
		await TestBed.configureTestingModule({
			imports: [
				AccountingOperationsCrudComponent,
				NoopAnimationsModule,
				NgxsModule.forRoot(
					[
						AccountingOperationsState,
						AccountingOperationsTableState,
						PaymentAccountState,
						CategoriesState,
						ContractorsState,
					],
					ngxsConfig
				),
			],
			providers: [
				{ provide: PaymentCommandExecutorService, useValue: { executeCreate } },
				{ provide: CategoriesDialogService, useValue: { openCategories: jasmine.createSpy() } },
				{ provide: ContractorsDialogService, useValue: { openContractors: jasmine.createSpy() } },
				{ provide: PaymentEditorLeaveService, useValue: createLeaveService() },
				PaymentEditorSessionService,
			],
		}).compileComponents();
		const store = TestBed.inject(Store);
		store.dispatch(new SetActivePaymentAccount('1c12ec59-8875-45c1-9fb0-e4edcf34a074'));
		const fixture = TestBed.createComponent(AccountingOperationsCrudComponent);
		fixture.detectChanges();
		const component = fixture.componentInstance;
		component.paymentForm.patchValue({ amount: 10, categoryId: Guid.create().toString(), comment: 'Payment A' });

		await component.submitAsync();
		fixture.detectChanges();

		expect(component.editorModeSignal()).toBe('create');
		expect(component.paymentForm.getRawValue()).toEqual(
			jasmine.objectContaining({ amount: 0, categoryId: '', comment: '' })
		);
		expect(store.selectSnapshot(getAccountingTableOptions).selectedRecordGuid).toBeUndefined();
		expect((fixture.nativeElement as HTMLElement).textContent).toContain('New payment');

		component.paymentForm.patchValue({ amount: 20, categoryId: Guid.create().toString(), comment: 'Payment B' });
		await component.submitAsync();

		expect(executeCreate).toHaveBeenCalledTimes(2);
		expect(component.editorModeSignal()).toBe('create');
		expect(component.isDirtySignal()).toBeFalse();
		expect(store.selectSnapshot(getAccountingTableOptions).selectedRecordGuid).toBeUndefined();
	});

	it('reconciles a selected operation that is no longer projected before an update can be submitted', async () => {
		const executeUpdate = jasmine.createSpy('executeUpdate');
		await TestBed.configureTestingModule({
			imports: [
				AccountingOperationsCrudComponent,
				NoopAnimationsModule,
				NgxsModule.forRoot(
					[
						AccountingOperationsState,
						AccountingOperationsTableState,
						PaymentAccountState,
						CategoriesState,
						ContractorsState,
					],
					ngxsConfig
				),
			],
			providers: [
				{
					provide: PaymentCommandExecutorService,
					useValue: { executeCreate: jasmine.createSpy(), executeUpdate },
				},
				{ provide: CategoriesDialogService, useValue: { openCategories: jasmine.createSpy() } },
				{ provide: ContractorsDialogService, useValue: { openContractors: jasmine.createSpy() } },
				{ provide: PaymentEditorLeaveService, useValue: createLeaveService() },
				PaymentEditorSessionService,
			],
		}).compileComponents();
		const store = TestBed.inject(Store);
		store.dispatch(new SetActivePaymentAccount('1c12ec59-8875-45c1-9fb0-e4edcf34a074'));
		store.dispatch(new SetActiveAccountingOperation(Guid.create()));
		const fixture = TestBed.createComponent(AccountingOperationsCrudComponent);
		fixture.detectChanges();

		await fixture.whenStable();
		fixture.detectChanges();

		expect(fixture.componentInstance.editorModeSignal()).toBe('create');
		expect(store.selectSnapshot(getAccountingTableOptions).selectedRecordGuid).toBeUndefined();
		expect(executeUpdate).not.toHaveBeenCalled();
	});

	it('uses a normalized baseline so browsing unchanged records does not request a discard', async () => {
		const confirmDiscard = jasmine.createSpy('confirmDiscard').and.resolveTo(true);
		const { fixture, store } = await createSelectedEditor(confirmDiscard);
		const component = fixture.componentInstance;

		expect(component.isDirtySignal()).toBeFalse();
		expect(await component.canLeaveEditor()).toBeTrue();
		expect(confirmDiscard).not.toHaveBeenCalled();

		store.dispatch(new SetActiveAccountingOperation(operationB().key));
		fixture.detectChanges();
		await fixture.whenStable();

		expect(component.paymentForm.controls.comment.value).toBe('Payment B');
		expect(component.isDirtySignal()).toBeFalse();
	});

	it('only requests a discard for a material edit and returns clean after restoring the baseline', async () => {
		const confirmDiscard = jasmine.createSpy('confirmDiscard').and.resolveTo(true);
		const { fixture } = await createSelectedEditor(confirmDiscard);
		const component = fixture.componentInstance;

		component.paymentForm.patchValue({ amount: 20 });
		expect(component.isDirtySignal()).toBeTrue();
		await component.canLeaveEditor();
		expect(confirmDiscard).toHaveBeenCalledTimes(1);

		component.paymentForm.patchValue({ amount: 10 });
		expect(component.isDirtySignal()).toBeFalse();
		await component.canLeaveEditor();
		expect(confirmDiscard).toHaveBeenCalledTimes(1);
	});

	it('keeps the projected local calendar date clean until it materially changes', async () => {
		const confirmDiscard = jasmine.createSpy('confirmDiscard').and.resolveTo(true);
		const { fixture } = await createSelectedEditor(confirmDiscard);
		const component = fixture.componentInstance;

		expect(component.paymentForm.controls.operationDate.value).toEqual(new Date(2026, 0, 1));
		expect(component.isDirtySignal()).toBeFalse();
		component.paymentForm.controls.operationDate.setValue(new Date(2026, 0, 1));
		expect(component.isDirtySignal()).toBeFalse();

		component.paymentForm.controls.operationDate.setValue(new Date(2026, 0, 2));
		expect(component.isDirtySignal()).toBeTrue();
		await component.canLeaveEditor();
		expect(confirmDiscard).toHaveBeenCalledTimes(1);

		component.paymentForm.controls.operationDate.setValue(new Date(2026, 0, 1));
		expect(component.isDirtySignal()).toBeFalse();
	});

	it('opens and closes the Material datepicker without changing the create baseline', async () => {
		const confirmDiscard = jasmine.createSpy('confirmDiscard').and.resolveTo(true);
		const { fixture, store } = await createSelectedEditor(confirmDiscard);
		const component = fixture.componentInstance;
		store.dispatch(new SetActiveAccountingOperation(undefined));
		fixture.detectChanges();
		await fixture.whenStable();
		const dateBeforeOpen = component.paymentForm.controls.operationDate.value;
		const datepicker = fixture.debugElement.query(By.directive(MatDatepicker))
			.componentInstance as MatDatepicker<Date>;

		datepicker.open();
		fixture.detectChanges();
		expect(document.querySelector('.mat-datepicker-content')).not.toBeNull();
		datepicker.close();
		fixture.detectChanges();

		expect(component.paymentForm.controls.operationDate.value).toEqual(dateBeforeOpen);
		expect(component.isDirtySignal()).toBeFalse();
		expect(await component.canLeaveEditor()).toBeTrue();
		expect(confirmDiscard).not.toHaveBeenCalled();
	});

	it('blocks a malformed manually entered calendar date and associates the error with the Date field', async () => {
		const { fixture, commandExecutor } = await createSelectedEditor();
		const component = fixture.componentInstance;
		const dateInput = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>(
			'input[formcontrolname="operationDate"]'
		);
		if (!dateInput) {
			throw new Error('Expected the Date field to accept Material datepicker keyboard input.');
		}

		dateInput.value = 'not a calendar date';
		dateInput.dispatchEvent(new Event('input'));
		component.paymentForm.controls.operationDate.markAsTouched();
		fixture.detectChanges();

		expect(component.paymentForm.controls.operationDate.invalid).toBeTrue();
		expect((fixture.nativeElement as HTMLElement).textContent).toContain('Enter a valid operation date.');
		await component.submitAsync();
		expect(commandExecutor.executeUpdate).not.toHaveBeenCalled();
	});

	it('restores an edited baseline before safely selecting another payment', async () => {
		const confirmDiscard = jasmine.createSpy('confirmDiscard').and.resolveTo(true);
		const { fixture, store } = await createSelectedEditor(confirmDiscard);
		const component = fixture.componentInstance;

		component.paymentForm.controls.comment.setValue('Unsaved change');
		expect(component.isDirtySignal()).toBeTrue();

		component.cancel();
		expect(component.paymentForm.controls.comment.value).toBe('Payment A');
		expect(component.isDirtySignal()).toBeFalse();

		expect(await component.canLeaveEditor()).toBeTrue();
		store.dispatch(new SetActiveAccountingOperation(operationB().key));
		fixture.detectChanges();
		await fixture.whenStable();

		expect(confirmDiscard).not.toHaveBeenCalled();
		expect(component.paymentForm.controls.comment.value).toBe('Payment B');
	});

	it('uses the projected update as the selected editor baseline and preserves its calendar day', async () => {
		const confirmDiscard = jasmine.createSpy('confirmDiscard').and.resolveTo(true);
		const { fixture, store, commandExecutor } = await createSelectedEditor(confirmDiscard);
		const component = fixture.componentInstance;
		const updatedOperation = paymentOperation(
			operationA().key.toString(),
			10,
			'Updated payment',
			new Date(2026, 0, 2)
		);
		commandExecutor.executeUpdate.and.callFake(() => {
			store.dispatch(new SetInitialPaymentOperations([updatedOperation, operationB()]));
			return Promise.resolve({ status: 'projected', paymentOperationId: updatedOperation.key.toString() });
		});

		component.paymentForm.patchValue({
			comment: updatedOperation.comment,
			operationDate: updatedOperation.operationDate,
		});
		await component.submitAsync();
		fixture.detectChanges();
		await fixture.whenStable();

		expect(commandExecutor.executeUpdate).toHaveBeenCalledTimes(1);
		expect(component.editorModeSignal()).toBe('edit');
		expect(component.paymentForm.controls.comment.value).toBe('Updated payment');
		expect(component.paymentForm.controls.operationDate.value).toEqual(new Date(2026, 0, 2));
		expect(component.isDirtySignal()).toBeFalse();
		expect(store.selectSnapshot(getAccountingTableOptions).selectedRecordGuid?.toString()).toBe(
			operationA().key.toString()
		);
		expect((fixture.nativeElement as HTMLElement).textContent).toContain('Save changes');

		expect(await component.canLeaveEditor()).toBeTrue();
		store.dispatch(new SetActiveAccountingOperation(operationB().key));
		fixture.detectChanges();
		await fixture.whenStable();
		expect(confirmDiscard).not.toHaveBeenCalled();
	});

	it('clears the selection and editor identity after a projected delete', async () => {
		const { fixture, store } = await createSelectedEditor();
		const component = fixture.componentInstance;
		store.dispatch(new SetInitialPaymentOperations([operationB()]));

		(
			component as unknown as {
				applyExecutionResult: (
					operation: 'delete',
					result: { status: 'projected'; paymentOperationId: string },
					operationId: string
				) => void;
			}
		).applyExecutionResult(
			'delete',
			{ status: 'projected', paymentOperationId: operationA().key.toString() },
			operationA().key.toString()
		);
		fixture.detectChanges();
		await fixture.whenStable();

		expect(component.editorModeSignal()).toBe('create');
		expect(store.selectSnapshot(getAccountingTableOptions).selectedRecordGuid).toBeUndefined();
		expect(component.paymentForm.controls.comment.value).toBe('');
		expect(component.isDirtySignal()).toBeFalse();
		expect((fixture.nativeElement as HTMLElement).textContent).toContain('Create payment');
	});

	it('treats initialized create defaults as clean and only prompts after a material create edit', async () => {
		const confirmDiscard = jasmine.createSpy('confirmDiscard').and.resolveTo(false);
		const { fixture, store } = await createSelectedEditor(confirmDiscard);
		const component = fixture.componentInstance;
		store.dispatch(new SetActiveAccountingOperation(undefined));
		fixture.detectChanges();
		await fixture.whenStable();

		expect(component.editorModeSignal()).toBe('create');
		expect(component.isDirtySignal()).toBeFalse();
		expect(await component.canLeaveEditor()).toBeTrue();
		component.paymentForm.controls.comment.setValue('Draft payment');
		expect(component.isDirtySignal()).toBeTrue();
		expect(await component.canLeaveEditor()).toBeFalse();
		expect(confirmDiscard).toHaveBeenCalledTimes(1);

		component.cancel();
		expect(component.isDirtySignal()).toBeFalse();
		expect(await component.canLeaveEditor()).toBeTrue();
		expect(confirmDiscard).toHaveBeenCalledTimes(1);
	});

	it('accepts a future calendar date without adding an artificial maximum date', async () => {
		const { fixture } = await createSelectedEditor();
		const component = fixture.componentInstance;

		component.paymentForm.controls.operationDate.setValue(new Date(2099, 0, 1));

		expect(component.paymentForm.controls.operationDate.valid).toBeTrue();
		expect(component.isDirtySignal()).toBeTrue();
	});

	it('treats stable category identity and empty contractor representations as unchanged values', async () => {
		const confirmDiscard = jasmine.createSpy('confirmDiscard').and.resolveTo(true);
		const { fixture } = await createSelectedEditor(confirmDiscard);
		const component = fixture.componentInstance;
		const categoryId = operationA().categoryId.toString();

		component.paymentForm.patchValue({
			categoryId: { key: categoryId } as unknown as string,
			contractorId: Guid.EMPTY as unknown as string,
		});

		expect(component.isDirtySignal()).toBeFalse();
		expect(await component.canLeaveEditor()).toBeTrue();
		expect(confirmDiscard).not.toHaveBeenCalled();
	});

	it('keeps title and primary action consistent when switching from edit to create', async () => {
		const { fixture, store } = await createSelectedEditor();
		const nativeElement = fixture.nativeElement as HTMLElement;

		expect(nativeElement.textContent).toContain('Edit payment');
		expect(nativeElement.textContent).toContain('Save changes');
		expect(nativeElement.textContent).not.toContain('Create payment');

		store.dispatch(new SetActiveAccountingOperation(undefined));
		fixture.detectChanges();
		await fixture.whenStable();
		fixture.detectChanges();

		expect(nativeElement.textContent).toContain('New payment');
		expect(nativeElement.textContent).toContain('Create payment');
		expect(nativeElement.textContent).not.toContain('Save changes');
		expect(nativeElement.textContent).not.toContain('Delete');
	});

	it('clears editor session state and selection when the active account changes', async () => {
		const { fixture, store } = await createSelectedEditor();
		const editorSession = TestBed.inject(PaymentEditorSessionService);
		editorSession.queueRecentMutation(operationA().key, 'updated');
		editorSession.confirmRecentMutationIsVisible([operationA().key]);

		store.dispatch(new SetActivePaymentAccount('3c12ec59-8875-45c1-9fb0-e4edcf34a074'));
		fixture.detectChanges();
		await fixture.whenStable();

		expect(editorSession.editorModeSignal()).toBe('create');
		expect(editorSession.recentMutationSignal()).toBeUndefined();
		expect(store.selectSnapshot(getAccountingTableOptions).selectedRecordGuid).toBeUndefined();
	});

	async function createSelectedEditor(confirmDiscard = jasmine.createSpy('confirmDiscard').and.resolveTo(true)) {
		const commandExecutor = {
			executeCreate: jasmine.createSpy('executeCreate'),
			executeUpdate: jasmine.createSpy('executeUpdate'),
			executeDelete: jasmine.createSpy('executeDelete'),
		};
		await TestBed.configureTestingModule({
			imports: [
				AccountingOperationsCrudComponent,
				NoopAnimationsModule,
				NgxsModule.forRoot(
					[
						AccountingOperationsState,
						AccountingOperationsTableState,
						PaymentAccountState,
						CategoriesState,
						ContractorsState,
					],
					ngxsConfig
				),
			],
			providers: [
				{
					provide: PaymentCommandExecutorService,
					useValue: commandExecutor,
				},
				{ provide: CategoriesDialogService, useValue: { openCategories: jasmine.createSpy() } },
				{ provide: ContractorsDialogService, useValue: { openContractors: jasmine.createSpy() } },
				{
					provide: PaymentEditorLeaveService,
					useValue: {
						canLeave: () => Promise.resolve(true),
						confirmDiscard,
						register: () => () => undefined,
					},
				},
				PaymentEditorSessionService,
			],
		}).compileComponents();
		const store = TestBed.inject(Store);
		store.dispatch(new SetActivePaymentAccount('1c12ec59-8875-45c1-9fb0-e4edcf34a074'));
		store.dispatch([
			new SetInitialCategories([
				{
					key: operationA().categoryId,
					operationType: PaymentOperationTypes.Expense,
					nameNodes: ['Test category'],
				},
			]),
		]);
		store.dispatch(new SetInitialPaymentOperations([operationA(), operationB()]));
		store.dispatch(new SetActiveAccountingOperation(operationA().key));
		const fixture = TestBed.createComponent(AccountingOperationsCrudComponent);
		fixture.detectChanges();
		await fixture.whenStable();
		fixture.detectChanges();
		return { fixture, store, commandExecutor };
	}

	function operationA(): IPaymentOperationModel {
		return paymentOperation('1932b129-a5ca-4bbd-b0f9-4682720e25d9', 10, 'Payment A');
	}

	function operationB(): IPaymentOperationModel {
		return paymentOperation('5a4ab9fd-3128-43b6-ab4d-47c55a25c7cf', 15, 'Payment B');
	}

	function paymentOperation(
		key: string,
		amount: number,
		comment: string,
		operationDate = new Date(2026, 0, 1)
	): IPaymentOperationModel {
		return {
			key: Guid.parse(key),
			paymentAccountId: Guid.parse('1c12ec59-8875-45c1-9fb0-e4edcf34a074'),
			operationDate,
			contractorId: Guid.EMPTY,
			categoryId: Guid.parse('a7c82a9d-e78c-4d73-973a-f7e7f20de64b'),
			comment,
			amount,
			operationType: OperationTypes.Payment,
		};
	}

	function createLeaveService() {
		return {
			canLeave: () => Promise.resolve(true),
			confirmDiscard: () => Promise.resolve(true),
			register: () => () => undefined,
		};
	}
});
