import { NgModule } from '@angular/core';

import { MainDashboardComponent } from './components/dashboard/main-dashboard.component';
import { MainDashboardRoutingModule } from './main-dashboard-routing.module';
import { DashboardLayoutComponent } from '../../app/modules/app-bootstrap/components/dashboard-layout/dashboard-layout.component';
import { AppCoreModule } from '../../app/modules/core/core.module';
import { AngularMaterialSharedModule } from '../../app/modules/shared/angular-material.shared.module';
import { CustomUIComponentsSharedModule } from '../../app/modules/shared/custom-ui-components.shared.module';
import { AppSharedModule } from '../../app/modules/shared/shared.module';

@NgModule({
	declarations: [DashboardLayoutComponent],
	imports: [
		MainDashboardRoutingModule,
		MainDashboardComponent,
		AppSharedModule,
		AngularMaterialSharedModule,
		AppCoreModule,
		AngularMaterialSharedModule,
		CustomUIComponentsSharedModule,
	],
	providers: [],
	bootstrap: [DashboardLayoutComponent],
})
export class MainDashboardModule {}
