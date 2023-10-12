import { Routes, provideRouter, withDebugTracing } from '@angular/router';
import { NgModule } from '@angular/core';

import { CurrencyRatesDashboardComponent } from '../currency-rates';

const routes: Routes = [
	{ path: '', component: CurrencyRatesDashboardComponent },
];

@NgModule({
	imports: [],
	exports: [],
	providers: [provideRouter(routes, withDebugTracing())],
})
export class CurrencyRatesRoutingModule {}
