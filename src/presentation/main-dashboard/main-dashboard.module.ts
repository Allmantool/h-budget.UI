import { NgModule } from '@angular/core';
import { RouterLink } from '@angular/router';

import { MainDashboardComponent } from './components/dashboard/main-dashboard.component';
import { MainDashboardCartComponent } from './components/dashboard-item/main-dashboard-cart.component';
import { MainDashboardRoutingModule } from './main-dashboard-routing.module';
import { AngularMaterailSharedModule } from '../../app/modules/shared/angular-material.shared.module';
import { AppSharedModule } from '../../app/modules/shared/shared.module';

@NgModule({
	declarations: [MainDashboardComponent, MainDashboardCartComponent],
	imports: [MainDashboardRoutingModule, AppSharedModule, AngularMaterailSharedModule, RouterLink],
	providers: [],
	bootstrap: [],
})
export class MainDashboardModule {}
