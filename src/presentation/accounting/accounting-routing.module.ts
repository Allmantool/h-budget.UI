import { NgModule } from '@angular/core';
import { Routes, provideRouter, withDebugTracing } from '@angular/router';

import { AccountingOperationsCrudComponent, AccountingOperatiosGridComponent } from '../accounting';
import { PaymentAccountComponent } from './components/payment-account/payment-account.component';
import { PaymentAccountCrudComponent } from './components/payment-account-crud/payment-account-crud.component';

const routes: Routes = [
	{ path: 'operations', component: AccountingOperatiosGridComponent },
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
