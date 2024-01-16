/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { NgxsModule } from '@ngxs/store';
import { Observable, of, Subject } from 'rxjs';

import { AppCoreModule } from '../../../../../app/modules/core/core.module';
import { AngularMaterailSharedModule } from '../../../../../app/modules/shared/angular-material.shared.module';
import { DateRangeDialogComponent } from '../../../../../app/modules/shared/components/dialog/dates-rage/dates-range-dialog.component';
import { CustomUIComponentsSharedModule } from '../../../../../app/modules/shared/custom-ui-components.shared.module';
import { DialogContainer } from '../../../../../app/modules/shared/models/dialog-container';
import { DialogOperationTypes } from '../../../../../app/modules/shared/models/dialog-operation-types';
import { DialogProvider } from '../../../../../app/modules/shared/providers/dialog-provider';
import { AppSharedModule } from '../../../../../app/modules/shared/shared.module';
import { ngxsConfig } from '../../../../../app/modules/shared/store/ngxs.config';
import { CurrencyTableState } from '../../../../../app/modules/shared/store/states/rates/currency-table.state';
import { NationalBankCurrenciesProvider } from '../../../../../data/providers/rates/national-bank-currencies.provider';
import { DaysRangePayload } from '../../../../../domain/models/dates-range-payload.model';
import { CurrencyRateValueModel } from '../../../../../domain/models/rates/currency-rate-value.model';
import { CurrencyRateGroupModel } from '../../../../../domain/models/rates/currency-rates-group.model';
import { RatesDialogService } from '../../../../../presentation/currency-rates/services/rates-dialog.service';

describe('Rates dialog service', () => {
	let currencyRateProviderSpy: jasmine.SpyObj<NationalBankCurrenciesProvider>;
	let dialogProviderSpy: jasmine.SpyObj<DialogProvider>;

	const matDialogSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

	const mockDialogContainer: DialogContainer<DaysRangePayload, number> = {
		title: 'rates date dialog test-title',
		operationType: DialogOperationTypes.Create,
		onSubmit: (payload: DaysRangePayload): Observable<number> => new Subject<number>(),
	};

	let sut: RatesDialogService;

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
				{
					provide: MatDialogRef,
					useValue: matDialogSpy,
				},

				{
					provide: MAT_DIALOG_DATA,
					useValue: mockDialogContainer,
				},
				{
					provide: DialogProvider,
					useValue: dialogProviderSpy,
				},
				{
					provide: NationalBankCurrenciesProvider,
					useValue: currencyRateProviderSpy,
				},
			],
		});

		sut = TestBed.inject(RatesDialogService);
	});

	it('"DialogProvider" should be execute at least ones', () => {
		sut.openLoadRatesForPeriod();

		const componentUnderTest = TestBed.inject(DateRangeDialogComponent);

		componentUnderTest.getRates();

		expect(dialogProviderSpy.openDialog).toHaveBeenCalled();
	});
});
