import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Result } from 'core/result';

import { NgxsModule, Store } from '@ngxs/store';
import { Guid } from 'typescript-guid';

import { ngxsConfig } from '../../../app/modules/shared/store/ngxs.config';
import { AccountingOperationsTableState } from '../../../app/modules/shared/store/states/accounting/accounting-operations-table.state';
import { SetActivePaymentAccount } from '../../../app/modules/shared/store/states/accounting/actions/payment-account.actions';
import { PaymentAccountState } from '../../../app/modules/shared/store/states/accounting/payment-account.state';
import { AccountingOperationsState } from '../../../app/modules/shared/store/states/accounting/payment-operations.state';
import { CategoriesState } from '../../../app/modules/shared/store/states/handbooks/categories.state';
import { ContractorsState } from '../../../app/modules/shared/store/states/handbooks/contractors.state';
import { AccountingOperationsCrudComponent } from '../../../presentation/accounting/components/accounting-operations-crud/accounting-operations-crud.component';
import { AccountingOperationsService } from '../../../presentation/accounting/services/accounting-operations.service';
import { CategoriesDialogService } from '../../../presentation/accounting/services/categories-dialog.service';
import { ContractorsDialogService } from '../../../presentation/accounting/services/contractors-dialog.service';
import { PaymentEditorLeaveService } from '../../../presentation/accounting/services/payment-editor-leave.service';

describe('accounting operations CRUD component', () => {
	it('renders one create primary action and prevents concurrent submission', async () => {
		const write = jasmine.createSpy('updateAsync').and.returnValue(new Promise(() => undefined));
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
					provide: AccountingOperationsService,
					useValue: { updateAsync: write, reconcileProjectionAsync: jasmine.createSpy() },
				},
				{ provide: CategoriesDialogService, useValue: { openCategories: jasmine.createSpy() } },
				{ provide: ContractorsDialogService, useValue: { openContractors: jasmine.createSpy() } },
				{ provide: PaymentEditorLeaveService, useValue: createLeaveService() },
			],
		}).compileComponents();
		const store = TestBed.inject(Store);
		store.dispatch(new SetActivePaymentAccount('1c12ec59-8875-45c1-9fb0-e4edcf34a074'));
		const fixture: ComponentFixture<AccountingOperationsCrudComponent> = TestBed.createComponent(
			AccountingOperationsCrudComponent
		);
		fixture.detectChanges();
		const component = fixture.componentInstance;
		component.paymentForm.patchValue({ amount: 10, categoryId: Guid.create().toString() });

		void component.submitAsync();
		void component.submitAsync();

		expect(write).toHaveBeenCalledTimes(1);
		const nativeElement: unknown = fixture.nativeElement;
		if (!(nativeElement instanceof HTMLElement)) {
			throw new Error('Expected the fixture to render an HTMLElement.');
		}
		expect(nativeElement.textContent).toContain('Create payment');
	});

	it('re-enables the editor when a confirmed payment is not yet projected into history', async () => {
		const updateAsync = jasmine
			.createSpy('updateAsync')
			.and.resolveTo(new Result({ isSucceeded: true, payload: '11111111-1111-1111-1111-111111111111' }));
		const reconcileProjectionAsync = jasmine.createSpy('reconcileProjectionAsync').and.resolveTo(false);
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
				{ provide: AccountingOperationsService, useValue: { updateAsync, reconcileProjectionAsync } },
				{ provide: CategoriesDialogService, useValue: { openCategories: jasmine.createSpy() } },
				{ provide: ContractorsDialogService, useValue: { openContractors: jasmine.createSpy() } },
				{ provide: PaymentEditorLeaveService, useValue: createLeaveService() },
			],
		}).compileComponents();
		const store = TestBed.inject(Store);
		store.dispatch(new SetActivePaymentAccount('1c12ec59-8875-45c1-9fb0-e4edcf34a074'));
		const fixture = TestBed.createComponent(AccountingOperationsCrudComponent);
		fixture.detectChanges();
		const component = fixture.componentInstance;
		component.paymentForm.patchValue({ amount: 10, categoryId: Guid.create().toString() });

		await component.submitAsync();
		fixture.detectChanges();

		expect(component.submissionStateSignal().status).toBe('projectionDelayed');
		expect(component.isSubmittingSignal()).toBeFalse();
		expect((fixture.nativeElement as HTMLElement).textContent).toContain(
			'Payment was accepted, but account history has not updated yet.'
		);
	});

	function createLeaveService() {
		return {
			canLeave: () => Promise.resolve(true),
			confirmDiscard: () => Promise.resolve(true),
			register: () => () => undefined,
		};
	}
});
