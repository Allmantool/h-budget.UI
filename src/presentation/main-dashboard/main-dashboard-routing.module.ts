import { NgModule } from '@angular/core';
import { provideRouter, Routes, withDebugTracing } from '@angular/router';

import { MainDashboardComponent } from './components/dashboard/main-dashboard.component';
import { AccountingLayoutComponent } from 'app/modules/app-bootstrap/components/accounting-layout/accounting-layout.component';
import { DashboardLayoutComponent } from 'app/modules/app-bootstrap/components/dashboard-layout/dashboard-layout.component';

const routes: Routes = [
	{
		path: '',
		component: DashboardLayoutComponent,
		children: [
      	{
			path: '',
			component: MainDashboardComponent
		}
    ]
	},
	{
		path: 'currency-rates',
		component: DashboardLayoutComponent,
		loadChildren: () => import('../currency-rates').then(m => m.CurrencyRatesModule),
	},
	{
		path: 'accounting',
		component: AccountingLayoutComponent,
		loadChildren: () => import('../accounting').then(m => m.AccountingModule),
	},
];

@NgModule({
	imports: [],
	exports: [],
	providers: [provideRouter(routes, withDebugTracing())],
})
export class MainDashboardRoutingModule {}
