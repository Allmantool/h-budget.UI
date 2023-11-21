import { NgModule } from '@angular/core';

import { MapperModule } from '@dynamic-mapper/angular';
import { NgxsModule } from '@ngxs/store';

import {
	CurrencyRatesDashboardComponent,
	CurrencyRatesGridComponent,
	CurrencyRatesLineChartComponent,
	CurrencyRatesRoutingModule,
} from '../currency-rates';
import { LineChartService } from './services/line-chart.service';
import { DataRatesMappingProfile } from 'data/providers/rates/mappers/data-rates-mapping.profiler';
import { NationalBankCurrencyProvider } from 'data/providers/rates/national-bank-currency.provider';
import { RatesDialogService } from './services/rates-dialog.service';
import { AppCoreModule } from '../../app/modules/core';
import { AppSharedModule } from '../../app/modules/shared/shared.module';
import { CurrencyRatesState } from '../../app/modules/shared/store/states/rates/currency-rates.state';
import { CurrencyRatesGridService } from './services/currency-rates-grid.service';
import { PresentationRatesMappingProfile } from './mappers/presentation-rates-mapping.profiler';
import { CurrencyTableState } from '../../app/modules/shared/store/states/rates/currency-table.state';
import { CurrencyChartState } from '../../app/modules/shared/store/states/rates/currency-chart.state';
import { DialogsSharedModule } from '../../app/modules/shared/dialogs.shared.module';
import { AngularMaterailSharedModule } from '../../app/modules/shared/angular-material.shared.module';
import { CustomUIComponentsSharedModule } from '../../app/modules/shared/custom-ui-components.shared.module';

@NgModule({
	declarations: [CurrencyRatesDashboardComponent, CurrencyRatesGridComponent, CurrencyRatesLineChartComponent],
	imports: [
		AppCoreModule,
		AppSharedModule,
		AngularMaterailSharedModule,
		CustomUIComponentsSharedModule,
		DialogsSharedModule,
		CurrencyRatesRoutingModule,
		NgxsModule.forFeature([CurrencyRatesState, CurrencyTableState, CurrencyChartState]),
		MapperModule.withProfiles([DataRatesMappingProfile, PresentationRatesMappingProfile]),
	],
	providers: [LineChartService, RatesDialogService, NationalBankCurrencyProvider, CurrencyRatesGridService],
	bootstrap: [],
})
export class CurrencyRatesModule {}
