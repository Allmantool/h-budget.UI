import { NgModule } from '@angular/core';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatStepperModule } from '@angular/material/stepper';
import { MatTableModule } from '@angular/material/table';

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
