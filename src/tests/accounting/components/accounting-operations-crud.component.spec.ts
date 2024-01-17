import { Store } from '@ngxs/store';

import { AccountingOperationsCrudComponent } from '../../../presentation/accounting/components/accounting-operations-crud/accounting-operations-crud.component';
import { AccountingOperationsService } from '../../../presentation/accounting/services/accounting-operations.service';
import { CategoriesDialogService } from '../../../presentation/accounting/services/categories-dialog.service';
import { ContractorsDialogService } from '../../../presentation/accounting/services/counterparties-dialog.service';
import { PaymentsHistoryService } from '../../../presentation/accounting/services/payments-history.service';

describe('Accouting operations crud component', () => {
	let sut: AccountingOperationsCrudComponent;

	let accountingOperationsServiceSpy: AccountingOperationsService;
	let categoriesDialogServiceSpy: CategoriesDialogService;
	let contractorsDialogServiceSpy: ContractorsDialogService;
	let paymentHistoryServiceSpy: PaymentsHistoryService;

	let store: Store;
});
