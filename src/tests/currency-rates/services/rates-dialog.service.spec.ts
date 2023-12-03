import { TestBed } from '@angular/core/testing';

import { Store } from '@ngxs/store';

import { DialogProvider } from '../../../app/modules/shared/providers/dialog-provider';
import { NationalBankCurrenciesProvider } from '../../../data/providers/rates/national-bank-currencies.provider';
import { RatesDialogService } from '../../../presentation/currency-rates/services/rates-dialog.service';

describe('Rate dialog service', () => {
	let nationalBankCurrencyProviderSpy: jasmine.SpyObj<NationalBankCurrenciesProvider>;
	let storerSpy: jasmine.SpyObj<Store>;
	let dialogProviderSpy: jasmine.SpyObj<DialogProvider>;

	let sut: RatesDialogService;

	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [
				RatesDialogService,
				{ provide: DialogProvider, useValue: dialogProviderSpy },
				{ provide: Store, useValue: storerSpy },
				{
					provide: NationalBankCurrenciesProvider,
					useValue: nationalBankCurrencyProviderSpy,
				},
			],
		});

		const sut = TestBed.inject(RatesDialogService);
	});

	it('should use ValueService', () => {
		const dialogProviderSpy = jasmine.createSpyObj('DialogProvider', ['openDialog']);
		const currencyRateProviderSpy = jasmine.createSpyObj('NationalBankCurrencyProvider', [
			'getCurrenciesForSpecifiedPeriod',
		]);
		const storeSpy = jasmine.createSpyObj('Store', ['dispatch']);

		const rateService = new RatesDialogService(dialogProviderSpy, currencyRateProviderSpy, storeSpy);

		expect(rateService.openLoadRatesForPeriod());
	});
});
