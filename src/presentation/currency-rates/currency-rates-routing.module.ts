import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { CurrencyRatesDashboardComponent } from './components/currency-rates-dashboard/currency-rates-dashboard.component';

const routes: Routes = [
	{
		path: '',
		component: CurrencyRatesDashboardComponent,
	},
];

@NgModule({
	imports: [RouterModule.forChild(routes)],
	exports: [RouterModule],
})
export class CurrencyRatesRoutingModule {}
