import { NgModule } from '@angular/core';
import { NgxsModule } from '@ngxs/store';

import {
	AccountingRoutingModule,
	AccountingOperatiosGridComponent,
	AccountingOperationsCrudComponent,
} from '../accounting';
import { AccountingOperationsTableState } from '../../app/modules/shared/store/states/accounting/accounting-operations-table.state';
import { CategoriesDialogService } from 'presentation/currency-rates/services/categories-dialog.service';
import { CounterpartiesState } from '../../app/modules/shared/store/states/handbooks/counterparties.state';
import { CategoriesState } from '../../app/modules/shared/store/states/handbooks/categories.state';
import { HandbbooksState } from '../../app/modules/shared/store/states/handbooks/handbooks.state';
import { AppSharedModule } from '../../app/modules/shared/shared.module';
import { AccountingOperationsState } from '../../app/modules/shared/store/states/accounting/accounting-operations.state';
import { CounterpartiesDialogService } from '../currency-rates/services/counterparties-dialog.service';
import { PaymentAccountComponent } from './components/payment-account/payment-account.component';
import { PaymentAccountState } from '../../app/modules/shared/store/states/accounting/payment-account.state';
import { PaymentAccountCrudComponent } from './components/payment-account-crud/payment-account-crud.component';

@NgModule({
	declarations: [
		AccountingOperatiosGridComponent,
		AccountingOperationsCrudComponent,
		PaymentAccountComponent,
		PaymentAccountCrudComponent,
	],
	imports: [
		AppSharedModule,
		AccountingRoutingModule,
		NgxsModule.forFeature([
			AccountingOperationsState,
			AccountingOperationsTableState,
			HandbbooksState,
			CounterpartiesState,
			CategoriesState,
			PaymentAccountState,
		]),
	],
	providers: [CategoriesDialogService, CounterpartiesDialogService],
	bootstrap: [],
})
export class AccountingModule {}
