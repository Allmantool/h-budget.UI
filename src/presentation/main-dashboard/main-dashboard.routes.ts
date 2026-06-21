import { Routes } from '@angular/router';
import { AccountingLayoutComponent } from 'app/modules/app-bootstrap/components/accounting-layout/accounting-layout.component';
import { DashboardLayoutComponent } from 'app/modules/app-bootstrap/components/dashboard-layout/dashboard-layout.component';

import { MainDashboardComponent } from './components/dashboard/main-dashboard.component';

export const mainDashboardRoutes: Routes = [
	{
		path: '',
		component: DashboardLayoutComponent,
		children: [
			{
				path: '',
				component: MainDashboardComponent,
			},
		],
	},
	{
		path: 'currency-rates',
		component: DashboardLayoutComponent,
		loadChildren: () => import('../currency-rates/currency-rates.routes').then(m => m.currencyRatesRoutes),
	},
	{
		path: 'accounting',
		component: AccountingLayoutComponent,
		loadChildren: () => import('../accounting').then(m => m.AccountingModule),
	},
];
