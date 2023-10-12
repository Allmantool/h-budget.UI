/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

/*

import { TestBed } from '@angular/core/testing';

import { NgxsModule, Store } from '@ngxs/store';

import { NationalBankCurrencyProvider } from 'data/providers/rates/national-bank-currency.provider';
import { AppSharedModule } from 'app/modules/shared';
import { DialogProvider } from 'app/modules/shared/providers/dialog-provider';
import { ngxsConfig } from 'app/modules/shared/store/ngxs.config';
import { CurrencyRatesState } from 'app/modules/shared/store/states/rates/currency-rates.state';
import { CurrencyRatesGridComponent } from '../../../../presentation/currency-rates/components/currency-rates-grid/currency-rates-grid.component';


describe('Currency rates grid conponent', () => {
	let sut: CurrencyRatesGridComponent;

	let store: Store;
	let currencyRateProviderSpy: any;
	let dialogProviderSpy: any;

	beforeEach(() => {
		currencyRateProviderSpy = jasmine.createSpyObj('currencyRateProvider', [
			'getCurrencies',
			'getCurrenciesForSpecifiedPeriod',
		]);

		dialogProviderSpy = jasmine.createSpyObj('dialogProvider', [
			'openDialog',
		]);

		TestBed.configureTestingModule({
			imports: [
				NgxsModule.forRoot([CurrencyRatesState], ngxsConfig),
				AppSharedModule,
			],
			providers: [
				CurrencyRatesGridComponent,
				{
					provide: NationalBankCurrencyProvider,
					useValue: currencyRateProviderSpy,
				},
				{ provide: DialogProvider, useValue: dialogProviderSpy },
			],
		}).compileComponents();

		sut = TestBed.inject(CurrencyRatesGridComponent);
	});

	//it('it "getTodayCurrencyRates": ', () => {});
});

*/
