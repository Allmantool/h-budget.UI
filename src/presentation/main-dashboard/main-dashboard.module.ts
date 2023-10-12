import { NgModule } from '@angular/core';
import { RouterLink } from '@angular/router';

import { MainDashboardRoutingModule } from './main-dashboard-routing.module';
import { MainDashboardComponent } from './components/dashboard/main-dashboard.component';
import { MainDashboardCartComponent } from './components/dashboard-item/main-dashboard-cart.component';
import { AppSharedModule } from 'app/modules/shared';

@NgModule({
	declarations: [MainDashboardComponent, MainDashboardCartComponent],
	imports: [MainDashboardRoutingModule, AppSharedModule, RouterLink],
	providers: [],
	bootstrap: [],
})
export class MainDashboardModule {}
