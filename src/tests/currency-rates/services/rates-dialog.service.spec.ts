/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { TestBed } from '@angular/core/testing';

import { NgxsModule, Store } from '@ngxs/store';
import { of } from 'rxjs';

import { AppCoreModule } from '../../../app/modules/core/core.module';
import { AngularMaterailSharedModule } from '../../../app/modules/shared/angular-material.shared.module';
import { DateRangeDialogComponent } from '../../../app/modules/shared/components/dialog/dates-rage/dates-range-dialog.component';
import { CustomUIComponentsSharedModule } from '../../../app/modules/shared/custom-ui-components.shared.module';
import { DialogProvider } from '../../../app/modules/shared/providers/dialog-provider';
import { AppSharedModule } from '../../../app/modules/shared/shared.module';
import { ngxsConfig } from '../../../app/modules/shared/store/ngxs.config';
import { CurrencyRatesState } from '../../../app/modules/shared/store/states/rates/currency-rates.state';
import { CurrencyTableState } from '../../../app/modules/shared/store/states/rates/currency-table.state';
import { ICurrencyRatesStateModel } from '../../../app/modules/shared/store/states/rates/models/currency-rates-state.model';
import { NationalBankCurrenciesProvider } from '../../../data/providers/rates/national-bank-currencies.provider';
import { CurrencyRateValueModel } from '../../../domain/models/rates/currency-rate-value.model';
import { CurrencyRateGroupModel } from '../../../domain/models/rates/currency-rates-group.model';
import { RatesDialogService } from '../../../presentation/currency-rates/services/rates-dialog.service';

describe('Rates dialog service', () => {
	let currencyRateProviderSpy: jasmine.SpyObj<NationalBankCurrenciesProvider>;
	let dialogProviderSpy: jasmine.SpyObj<DialogProvider>;

	let sut: RatesDialogService;
	let store: Store;

	beforeEach(() => {
		dialogProviderSpy = jasmine.createSpyObj('dialogProvider', ['openDialog']);

		currencyRateProviderSpy = jasmine.createSpyObj('currencyRatesProvider', {
			getCurrenciesForSpecifiedPeriod: () =>
				of<CurrencyRateGroupModel[]>([
					new CurrencyRateGroupModel({
						currencyId: 1,
						name: 'currency-a',
						abbreviation: 'cur-a',
						scale: 1,
						rateValues: [new CurrencyRateValueModel({})],
					}),
				]),
		});

		TestBed.configureTestingModule({
			imports: [
				AppCoreModule,
				AngularMaterailSharedModule,
				CustomUIComponentsSharedModule,
				AppSharedModule,
				NgxsModule.forRoot([CurrencyTableState], ngxsConfig),
			],
			providers: [
				DateRangeDialogComponent,
				RatesDialogService,
				DialogProvider,
				{
					provide: NationalBankCurrenciesProvider,
					useValue: currencyRateProviderSpy,
				},
			],
		});

		sut = TestBed.inject(RatesDialogService);
		store = TestBed.inject(Store);
	});

	it('rates dialog service should by "openLoadRatesForPeriod"', () => {
		// sut.openLoadRatesForPeriod();

		// const currencyRatesState: ICurrencyRatesStateModel = store.selectSnapshot(CurrencyRatesState);

		expect();
	});
});
