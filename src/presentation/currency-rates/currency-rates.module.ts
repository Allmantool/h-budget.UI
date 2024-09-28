import { NgModule } from '@angular/core';

import { MapperModule } from '@dynamic-mapper/angular';
import { NgxsModule } from '@ngxs/store';

import { DataRatesMappingProfile } from 'data/providers/rates/mappers/data-rates-mapping.profiler';
import { NationalBankCurrenciesProvider } from 'data/providers/rates/national-bank-currencies.provider';

import { PresentationRatesMappingProfile } from './mappers/presentation-rates-mapping.profiler';
import { CurrencyRatesGridService } from './services/currency-rates-grid.service';
import { LineChartService } from './services/line-chart.service';
import { RatesDialogService } from './services/rates-dialog.service';
import { AppCoreModule } from '../../app/modules/core';
import { AngularMaterialSharedModule } from '../../app/modules/shared/angular-material.shared.module';
import { CustomUIComponentsSharedModule } from '../../app/modules/shared/custom-ui-components.shared.module';
import { DialogsSharedModule } from '../../app/modules/shared/dialogs.shared.module';
import { AppSharedModule } from '../../app/modules/shared/shared.module';
import { CurrencyChartState } from '../../app/modules/shared/store/states/rates/currency-chart.state';
import { CurrencyRatesState } from '../../app/modules/shared/store/states/rates/currency-rates.state';
import { CurrencyTableState } from '../../app/modules/shared/store/states/rates/currency-table.state';
import {
	CurrencyRatesDashboardComponent,
	CurrencyRatesGridComponent,
	CurrencyRatesLineChartComponent,
	CurrencyRatesRoutingModule,
} from '../currency-rates';

@NgModule({
	declarations: [CurrencyRatesDashboardComponent, CurrencyRatesGridComponent, CurrencyRatesLineChartComponent],
	imports: [
		CurrencyRatesRoutingModule,
		AppCoreModule,
		AppSharedModule,
		AngularMaterialSharedModule,
		CustomUIComponentsSharedModule,
		DialogsSharedModule,
		NgxsModule.forFeature([CurrencyRatesState, CurrencyTableState, CurrencyChartState]),
		MapperModule.withProfiles([DataRatesMappingProfile, PresentationRatesMappingProfile]),
	],
	providers: [LineChartService, RatesDialogService, NationalBankCurrenciesProvider, CurrencyRatesGridService],
	bootstrap: [CurrencyRatesDashboardComponent],
})
export class CurrencyRatesModule {}
