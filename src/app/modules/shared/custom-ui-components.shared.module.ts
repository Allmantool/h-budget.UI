import { NgModule } from '@angular/core';

import { DatepickerComponent } from './components/datepicker/app-datepicker.component';
import { AppFormFieldComponent } from './components/form-field/app-form-field.component';
import { AppButtonComponent } from './components/button/app-button.component';
import { ProgressBarComponent } from './components/progress-bar/progress-bar.component';
import { AppSharedModule } from './shared.module';
import { AppDividerComponent } from './components/divider/app-divider.component';
import { AngularMaterailSharedModule } from './angular-material.shared.module';
import { ProgressSpinnerComponent } from './components/progress-spinner/progress-spinner.component';
import { AppCoreModule } from '../core';

const customUIComponents = [
	AppDividerComponent,
	ProgressSpinnerComponent,
	ProgressBarComponent,
	DatepickerComponent,
	AppFormFieldComponent,
	AppButtonComponent,
];

@NgModule({
	declarations: [customUIComponents],
	exports: [customUIComponents],
	imports: [AppCoreModule, AppSharedModule, AngularMaterailSharedModule],
	providers: [],
	bootstrap: [],
})
export class CustomUIComponentsSharedModule {}
