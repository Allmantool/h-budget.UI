import { NgModule } from '@angular/core';

import { MainDashboardComponent } from './components/dashboard/main-dashboard.component';
import { MainDashboardCartComponent } from './components/dashboard-item/main-dashboard-cart.component';
import { MainDashboardRoutingModule } from './main-dashboard-routing.module';
import { AngularMaterialSharedModule } from '../../app/modules/shared/angular-material.shared.module';
import { AppSharedModule } from '../../app/modules/shared/shared.module';
import { DashboardLayoutComponent } from '../../app/modules/app-bootstrap/components/dashboard-layout/dashboard-layout.component';
import { AppCoreModule } from '../../app/modules/core/core.module';
import { CustomUIComponentsSharedModule } from '../../app/modules/shared/custom-ui-components.shared.module';

@NgModule({
	declarations: [MainDashboardComponent, MainDashboardCartComponent, DashboardLayoutComponent],
	imports: [
		MainDashboardRoutingModule,
		AppSharedModule,
		AngularMaterialSharedModule,
		AppCoreModule,
		AngularMaterialSharedModule,
		CustomUIComponentsSharedModule
	],
	providers: [],
	bootstrap: [DashboardLayoutComponent],
})
export class MainDashboardModule {}
