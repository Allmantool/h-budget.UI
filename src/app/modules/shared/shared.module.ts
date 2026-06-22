import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { NgApexchartsModule } from 'ng-apexcharts';

import { AngularMaterialSharedModule } from './angular-material.shared.module';
import { AppCoreModule } from '../core';
import { PageNotFoundComponent } from './components/page-not-found/page-not-found.component';
import { AccountingCurrencyFormatPipe } from './pipes/accounting-currency.pipe';
import { CurrencyAbbreviationToFlagFormatPipe } from './pipes/currency-abbreviation-to-flag.pipe';

@NgModule({
	exports: [
		CommonModule,

		PageNotFoundComponent,

		NgApexchartsModule,

		FormsModule,
		ReactiveFormsModule,

		AccountingCurrencyFormatPipe,
		CurrencyAbbreviationToFlagFormatPipe,
	],
	imports: [
		AppCoreModule,
		ReactiveFormsModule,
		AngularMaterialSharedModule,
		PageNotFoundComponent,
		AccountingCurrencyFormatPipe,
		CurrencyAbbreviationToFlagFormatPipe,
	],
	providers: [],
	bootstrap: [],
})
export class AppSharedModule {}
