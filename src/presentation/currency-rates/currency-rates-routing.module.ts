import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { CurrencyRatesDashboardComponent } from './components/currency-rates-dashboard/currency-rates-dashboard.component';

export const currencyRatesRoutes: Routes = [
	{
		path: '',
		component: CurrencyRatesDashboardComponent,
	},
];

@NgModule({
	imports: [RouterModule.forChild(currencyRatesRoutes)],
	exports: [RouterModule],
})
export class CurrencyRatesRoutingModule {}
