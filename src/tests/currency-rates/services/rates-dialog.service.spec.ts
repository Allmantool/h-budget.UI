import { TestBed } from '@angular/core/testing';

import { Store } from '@ngxs/store';

import { DialogProvider } from '../../../app/modules/shared/providers/dialog-provider';
import { NationalBankCurrenciesProvider } from '../../../data/providers/rates/national-bank-currencies.provider';
import { RatesDialogService } from '../../../presentation/currency-rates/services/rates-dialog.service';

describe('Rate dialog service', () => {
	let nationalBankCurrencyProviderSpy: jasmine.SpyObj<NationalBankCurrenciesProvider>;
	let storeSpy: jasmine.SpyObj<Store>;
	let dialogProviderSpy: jasmine.SpyObj<DialogProvider>;
	let currencyRateProviderSpy: jasmine.SpyObj<NationalBankCurrenciesProvider>;

	let sut: RatesDialogService;

	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [
				RatesDialogService,
				{ provide: DialogProvider, useValue: dialogProviderSpy },
				{ provide: Store, useValue: storeSpy },
				{
					provide: NationalBankCurrenciesProvider,
					useValue: nationalBankCurrencyProviderSpy,
				},
			],
		});

		const sut = TestBed.inject(RatesDialogService);
	});

	it('should use ValueService', () => {
		dialogProviderSpy = jasmine.createSpyObj('dialogProvider', ['openDialog']);
		currencyRateProviderSpy = jasmine.createSpyObj('currencyRatesProvider', ['getCurrenciesForSpecifiedPeriod']);
		storeSpy = jasmine.createSpyObj('store', ['dispatch']);

		const rateService = new RatesDialogService(dialogProviderSpy, currencyRateProviderSpy, storeSpy);

		expect(rateService.openLoadRatesForPeriod());
	});
});
