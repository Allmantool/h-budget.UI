import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { NgApexchartsModule } from 'ng-apexcharts';

import { AngularMaterailSharedModule } from './angular-material.shared.module';
import { PageNotFoundComponent } from './components/page-not-found/page-not-found.component';
import { AccountingCurrencyFormatPipe } from './pipes/accouting-currency.pipe';
import { CurrencyAbreviationToFlagFormatPipe } from './pipes/currency-abbreviation-to-flag.pipe';
import { AppCoreModule } from '../core';

@NgModule({
	declarations: [PageNotFoundComponent, AccountingCurrencyFormatPipe, CurrencyAbreviationToFlagFormatPipe],
	exports: [
		CommonModule,

		PageNotFoundComponent,

		NgApexchartsModule,

		FormsModule,
		ReactiveFormsModule,

		AccountingCurrencyFormatPipe,
		CurrencyAbreviationToFlagFormatPipe,
	],
	imports: [AppCoreModule, ReactiveFormsModule, AngularMaterailSharedModule],
	providers: [],
	bootstrap: [],
})
export class AppSharedModule {}
