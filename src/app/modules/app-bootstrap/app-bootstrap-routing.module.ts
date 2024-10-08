import { NgModule } from '@angular/core';
import { PreloadAllModules, provideRouter, Routes, withDebugTracing, withPreloading } from '@angular/router';

import { PageNotFoundComponent } from '../shared/components/page-not-found/page-not-found.component';

const routes: Routes = [
	{ path: '', redirectTo: 'dashboard', pathMatch: 'full' },
	{
		path: 'dashboard',
		loadChildren: () => import('../../../presentation/main-dashboard').then(m => m.MainDashboardModule),
	},
	{ path: '**', component: PageNotFoundComponent },
];

@NgModule({
	imports: [],
	exports: [],
	providers: [provideRouter(routes, withPreloading(PreloadAllModules), withDebugTracing())],
})
export class BootstrapRoutingModule {}
