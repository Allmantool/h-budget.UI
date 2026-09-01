import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { NgxsModule, Store } from '@ngxs/store';
import { Guid } from 'typescript-guid';

import { ngxsConfig } from '../../../app/modules/shared/store/ngxs.config';
import { SetActivePaymentAccount } from '../../../app/modules/shared/store/states/accounting/actions/payment-account.actions';
import { PaymentAccountState } from '../../../app/modules/shared/store/states/accounting/payment-account.state';
import { AccountingOperationsState } from '../../../app/modules/shared/store/states/accounting/payment-operations.state';
import { AccountingOperationsTableState } from '../../../app/modules/shared/store/states/accounting/accounting-operations-table.state';
import { CategoriesState } from '../../../app/modules/shared/store/states/handbooks/categories.state';
import { ContractorsState } from '../../../app/modules/shared/store/states/handbooks/contractors.state';
import { AccountingOperationsCrudComponent } from '../../../presentation/accounting/components/accounting-operations-crud/accounting-operations-crud.component';
import { AccountingOperationsService } from '../../../presentation/accounting/services/accounting-operations.service';
import { CategoriesDialogService } from '../../../presentation/accounting/services/categories-dialog.service';
import { ContractorsDialogService } from '../../../presentation/accounting/services/contractors-dialog.service';

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
		expect(fixture.nativeElement.textContent).toContain('Create payment');
	});
});
