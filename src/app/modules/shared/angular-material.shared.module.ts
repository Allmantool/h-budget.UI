import { NgModule } from '@angular/core';

import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatChipsModule } from '@angular/material/chips';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatListModule } from '@angular/material/list';
import { MatStepperModule } from '@angular/material/stepper';
import { MatDialogModule } from '@angular/material/dialog';
import { AppCoreModule } from '../core/core.module';

const material = [
	MatDividerModule,
	MatIconModule,
	MatSidenavModule,
	MatButtonToggleModule,
	MatProgressSpinnerModule,
	MatProgressBarModule,
	MatDatepickerModule,
	MatNativeDateModule,
	MatFormFieldModule,
	MatInputModule,
	MatSelectModule,
	MatTableModule,
	MatCheckboxModule,
	MatCardModule,
	MatButtonModule,
	MatExpansionModule,
	MatChipsModule,
	MatAutocompleteModule,
	MatListModule,
	MatStepperModule,
	MatDialogModule,
];

@NgModule({
	declarations: [],
	exports: [material],
	imports: [AppCoreModule, material],
	providers: [],
	bootstrap: [],
})
export class AngularMaterailSharedModule {}
