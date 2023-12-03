/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { TestBed } from '@angular/core/testing';

import { MapperModule } from '@dynamic-mapper/angular';
import { NgxsModule, Store } from '@ngxs/store';
import { of } from 'rxjs';

import { DialogProvider } from '../../../app/modules/shared/providers/dialog-provider';
import { AppSharedModule } from '../../../app/modules/shared/shared.module';
import { ngxsConfig } from '../../../app/modules/shared/store/ngxs.config';
import { CurrencyChartState } from '../../../app/modules/shared/store/states/rates/currency-chart.state';
import { CurrencyRatesState } from '../../../app/modules/shared/store/states/rates/currency-rates.state';
import { CurrencyTableState } from '../../../app/modules/shared/store/states/rates/currency-table.state';
import { DataRatesMappingProfile } from '../../../data/providers/rates/mappers/data-rates-mapping.profiler';
import { NationalBankCurrenciesProvider } from '../../../data/providers/rates/national-bank-currencies.provider';
import { CurrencyRateValueModel } from '../../../domain/models/rates/currency-rate-value.model';
import { CurrencyRateGroupModel } from '../../../domain/models/rates/currency-rates-group.model';
import { CurrencyRatesGridComponent } from '../../../presentation/currency-rates/components/currency-rates-grid/currency-rates-grid.component';
import { PresentationRatesMappingProfile } from '../../../presentation/currency-rates/mappers/presentation-rates-mapping.profiler';
import { CurrencyRatesGridService } from '../../../presentation/currency-rates/services/currency-rates-grid.service';
import { RatesDialogService } from '../../../presentation/currency-rates/services/rates-dialog.service';

describe('Currency rates grid conponent', () => {
	let sut: CurrencyRatesGridComponent;

	let store: Store;
	let currencyRateProviderSpy: any;
	let dialogProviderSpy: any;

	beforeEach(() => {
		currencyRateProviderSpy = jasmine.createSpyObj('currencyRatesProvider', {
			getTodayCurrencies: of<CurrencyRateGroupModel[]>([
				new CurrencyRateGroupModel({
					currencyId: 1,
					name: 'currency-a',
					abbreviation: 'cur-a',
					scale: 1,
					rateValues: [new CurrencyRateValueModel({})],
				}),
			]),
		});

		dialogProviderSpy = jasmine.createSpyObj('dialogProvider', ['openDialog']);

		TestBed.configureTestingModule({
			imports: [
				NgxsModule.forRoot([CurrencyRatesState, CurrencyTableState, CurrencyChartState], ngxsConfig),
				MapperModule.withProfiles([DataRatesMappingProfile, PresentationRatesMappingProfile]),
				AppSharedModule,
			],
			providers: [
				CurrencyRatesGridComponent,
				RatesDialogService,
				CurrencyRatesGridService,
				{
					provide: NationalBankCurrenciesProvider,
					useValue: currencyRateProviderSpy,
				},
				{ provide: DialogProvider, useValue: dialogProviderSpy },
			],
		}).compileComponents();

		sut = TestBed.inject(CurrencyRatesGridComponent);
	});

	it('it "getTodayCurrencyRates": ', (done: DoneFn) => {
		sut.getTodayCurrencyRates();
		done();
	});
});
