import { NgModule } from '@angular/core';
import { provideRouter, Routes, withDebugTracing } from '@angular/router';

import { CurrencyRatesDashboardComponent } from '../currency-rates';

const routes: Routes = [{
	path: '',
	component: CurrencyRatesDashboardComponent
}];

@NgModule({
	imports: [],
	exports: [],
	providers: [provideRouter(routes, withDebugTracing())],
})
export class CurrencyRatesRoutingModule {}
