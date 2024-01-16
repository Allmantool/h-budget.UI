import { NgModule } from '@angular/core';
import { provideRouter, Routes, withDebugTracing } from '@angular/router';

import { AccountingOperationsCrudComponent } from './components/accounting-operations-crud/accounting-operations-crud.component';
import { PaymentAccountComponent } from './components/payment-account/payment-account.component';
import { PaymentAccountCrudComponent } from './components/payment-account-crud/payment-account-crud.component';
import { PaymentsHistoryComponent } from './components/payments-history/payments-history.component';

const routes: Routes = [
	{ path: 'operations', component: PaymentsHistoryComponent },
	{ path: '', component: PaymentAccountComponent },
	{
		path: 'operations',
		component: AccountingOperationsCrudComponent,
		outlet: 'rightSidebar',
	},
	{ path: '', component: PaymentAccountCrudComponent, outlet: 'rightSidebar' },
];

@NgModule({
	imports: [],
	exports: [],
	providers: [provideRouter(routes, withDebugTracing())],
})
export class AccountingRoutingModule {}
