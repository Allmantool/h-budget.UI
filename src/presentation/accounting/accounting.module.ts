import { NgModule } from '@angular/core';
import { NgxsModule } from '@ngxs/store';

import {
	AccountingRoutingModule,
	AccountingOperatiosGridComponent,
	AccountingOperationsCrudComponent,
} from '../accounting';
import { AccountingOperationsTableState } from '../../app/modules/shared/store/states/accounting/accounting-operations-table.state';
import { CategoriesDialogService } from 'presentation/accounting/services/categories-dialog.service';
import { CounterpartiesState } from '../../app/modules/shared/store/states/handbooks/counterparties.state';
import { CategoriesState } from '../../app/modules/shared/store/states/handbooks/categories.state';
import { HandbbooksState } from '../../app/modules/shared/store/states/handbooks/handbooks.state';
import { AppSharedModule } from '../../app/modules/shared/shared.module';
import { AccountingOperationsState } from '../../app/modules/shared/store/states/accounting/accounting-operations.state';
import { CounterpartiesDialogService } from './services/counterparties-dialog.service';
import { PaymentAccountComponent } from './components/payment-account/payment-account.component';
import { PaymentAccountState } from '../../app/modules/shared/store/states/accounting/payment-account.state';
import { PaymentAccountCrudComponent } from './components/payment-account-crud/payment-account-crud.component';
import { PaymentAccountDialogService } from './services/payment-account-dialog.service';

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
	providers: [CategoriesDialogService, CounterpartiesDialogService, PaymentAccountDialogService],
	bootstrap: [],
})
export class AccountingModule {}
