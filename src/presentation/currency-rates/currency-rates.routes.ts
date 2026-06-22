import { importProvidersFrom } from '@angular/core';
import { Routes } from '@angular/router';
import { DataRatesMappingProfile } from 'data/providers/rates/mappers/data-rates-mapping.profiler';
import { NationalBankCurrenciesProvider } from 'data/providers/rates/national-bank-currencies.provider';

import { MapperModule } from '@dynamic-mapper/angular';
import { NgxsModule } from '@ngxs/store';

import { CurrencyRatesDashboardComponent } from './components/currency-rates-dashboard/currency-rates-dashboard.component';
import { PresentationRatesMappingProfile } from './mappers/presentation-rates-mapping.profiler';
import { CurrencyRatesGridService } from './services/currency-rates-grid.service';
import { LineChartService } from './services/line-chart.service';
import { RatesDialogService } from './services/rates-dialog.service';
import { DialogsSharedModule } from '../../app/modules/shared/dialogs.shared.module';
import { LoaderService } from '../../app/modules/shared/services/loader-service';
import { CurrencyChartState } from '../../app/modules/shared/store/states/rates/currency-chart.state';
import { CurrencyRatesState } from '../../app/modules/shared/store/states/rates/currency-rates.state';
import { CurrencyTableState } from '../../app/modules/shared/store/states/rates/currency-table.state';

export const currencyRatesRoutes: Routes = [
	{
		path: '',
		component: CurrencyRatesDashboardComponent,
		providers: [
			LineChartService,
			RatesDialogService,
			NationalBankCurrenciesProvider,
			CurrencyRatesGridService,
			LoaderService,
			importProvidersFrom(
				NgxsModule.forFeature([CurrencyRatesState, CurrencyTableState, CurrencyChartState]),
				MapperModule.withProfiles([DataRatesMappingProfile, PresentationRatesMappingProfile]),
				DialogsSharedModule
			),
		],
	},
];
