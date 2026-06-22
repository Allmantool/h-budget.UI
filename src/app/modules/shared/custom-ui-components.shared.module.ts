import { NgModule } from '@angular/core';

import { AppButtonComponent } from './components/button/app-button.component';
import { DatepickerComponent } from './components/datepicker/app-datepicker.component';
import { AppDividerComponent } from './components/divider/app-divider.component';
import { AppFormFieldComponent } from './components/form-field/app-form-field.component';
import { ProgressBarComponent } from './components/progress-bar/progress-bar.component';
import { ProgressSpinnerComponent } from './components/progress-spinner/progress-spinner.component';

const standaloneCustomUIComponents = [
	AppDividerComponent,
	ProgressSpinnerComponent,
	ProgressBarComponent,
	AppButtonComponent,
	DatepickerComponent,
	AppFormFieldComponent,
];

@NgModule({
	exports: [standaloneCustomUIComponents],
	imports: [standaloneCustomUIComponents],
	providers: [],
	bootstrap: [],
})
export class CustomUIComponentsSharedModule {}
