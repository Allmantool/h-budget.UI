import { NgModule } from '@angular/core';

import { AngularMaterialSharedModule } from './angular-material.shared.module';
import { AppButtonComponent } from './components/button/app-button.component';
import { DatepickerComponent } from './components/datepicker/app-datepicker.component';
import { AppDividerComponent } from './components/divider/app-divider.component';
import { AppFormFieldComponent } from './components/form-field/app-form-field.component';
import { ProgressBarComponent } from './components/progress-bar/progress-bar.component';
import { ProgressSpinnerComponent } from './components/progress-spinner/progress-spinner.component';
import { AppSharedModule } from './shared.module';
import { AppCoreModule } from '../core';

const standaloneCustomUIComponents = [
	AppDividerComponent,
	ProgressSpinnerComponent,
	ProgressBarComponent,
	AppButtonComponent,
];

const declaredCustomUIComponents = [DatepickerComponent, AppFormFieldComponent];

@NgModule({
	declarations: [declaredCustomUIComponents],
	exports: [standaloneCustomUIComponents, declaredCustomUIComponents],
	imports: [AppCoreModule, AppSharedModule, AngularMaterialSharedModule, standaloneCustomUIComponents],
	providers: [],
	bootstrap: [],
})
export class CustomUIComponentsSharedModule {}
