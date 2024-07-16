/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MapperModule } from '@dynamic-mapper/angular';
import { NgxsModule, Store } from '@ngxs/store';
import { of, take } from 'rxjs';

import { DialogProvider } from '../../../app/modules/shared/providers/dialog-provider';
import { AppSharedModule } from '../../../app/modules/shared/shared.module';
import { ngxsConfig } from '../../../app/modules/shared/store/ngxs.config';
import { SetActiveCurrency } from '../../../app/modules/shared/store/states/rates/actions/currency-table-options.actions';
import { CurrencyChartState } from '../../../app/modules/shared/store/states/rates/currency-chart.state';
import { CurrencyRatesState } from '../../../app/modules/shared/store/states/rates/currency-rates.state';
import { CurrencyTableState } from '../../../app/modules/shared/store/states/rates/currency-table.state';
import { ICurrencyTableStateModel } from '../../../app/modules/shared/store/states/rates/models/currency-table-state.model';
import { DataRatesMappingProfile } from '../../../data/providers/rates/mappers/data-rates-mapping.profiler';
import { NationalBankCurrenciesProvider } from '../../../data/providers/rates/national-bank-currencies.provider';
import { CurrencyRateValueModel } from '../../../domain/models/rates/currency-rate-value.model';
import { CurrencyRateGroupModel } from '../../../domain/models/rates/currency-rates-group.model';
import { CurrencyRatesGridComponent } from '../../../presentation/currency-rates/components/currency-rates-grid/currency-rates-grid.component';
import { CurrencyRatesModule } from '../../../presentation/currency-rates/currency-rates.module';
import { PresentationRatesMappingProfile } from '../../../presentation/currency-rates/mappers/presentation-rates-mapping.profiler';
import { CurrencyRatesGridService } from '../../../presentation/currency-rates/services/currency-rates-grid.service';
import { RatesDialogService } from '../../../presentation/currency-rates/services/rates-dialog.service';

describe('currency rates grid component', () => {
	let sut: CurrencyRatesGridComponent;
	let fixture: ComponentFixture<CurrencyRatesGridComponent>;

	let store: Store;
	let currencyRateProviderSpy: jasmine.SpyObj<NationalBankCurrenciesProvider>;
	let dialogProviderSpy: jasmine.SpyObj<DialogProvider>;

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

		// eslint-disable-next-line @typescript-eslint/no-floating-promises
		TestBed.configureTestingModule({
			imports: [
				NgxsModule.forRoot([CurrencyRatesState, CurrencyTableState, CurrencyChartState], ngxsConfig),
				MapperModule.withProfiles([DataRatesMappingProfile, PresentationRatesMappingProfile]),
				AppSharedModule,
				CurrencyRatesModule,
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
		})
			.compileComponents()
			.then(() => {
				fixture = TestBed.createComponent(CurrencyRatesGridComponent);
			});

		store = TestBed.inject(Store);
		sut = TestBed.inject(CurrencyRatesGridComponent);
	});

	it('should create the component', () => {
		expect(fixture.componentInstance).toBeTruthy();
	});

	it('should set store with appropriate target currency settings by "masterToggle"', (done: DoneFn) => {
		const currencyIdUnderTest: number = 1;
		const currencyAbbreviationUnderTest: string = 'test currency';

		sut.masterToggle(currencyIdUnderTest, currencyAbbreviationUnderTest);
		const tableOptionsStore = store.selectSnapshot<ICurrencyTableStateModel>((state) => state.currencyState.currencyTableState);

		expect(tableOptionsStore.tableOptions.selectedItem.currencyId).toBe(currencyIdUnderTest);
		expect(tableOptionsStore.tableOptions.selectedItem.abbreviation).toBe(currencyAbbreviationUnderTest);
		done();
	});

	it('should populate today currency rate groups by "getTodayCurrencyRatesAsync"', async () => {
		await sut.getTodayCurrencyRatesAsync();

		sut.todayCurrencyRateGroups$.pipe(take(1)).subscribe(rateGroups => {
			expect(rateGroups.length).toBe(1);
		});
	});

	it('should trigger open rates dialog "openGetCurrencyRatesDialog"', () => {
		sut.openGetCurrencyRatesDialog();

		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
		expect(dialogProviderSpy.openDialog).toHaveBeenCalled();
	});

	it('should go along with expected currency table options by "isSelectedCurrency"', (done: DoneFn) => {
		const currencyIdUnderTest: number = 3;

		store.dispatch(new SetActiveCurrency(currencyIdUnderTest, ''));

		expect(sut.isSelectedCurrency(currencyIdUnderTest)).toBe(true);
		done();
	});

	it('should set store with appropriate target currency table settings by "setDateRange"', (done: DoneFn) => {
		const defaultMonthAmount: number = 7;

		sut.setDateRange(defaultMonthAmount);
		const tableOptionsStore: ICurrencyTableStateModel = store.selectSnapshot<ICurrencyTableStateModel>((state) => state.currencyState.currencyTableState);

		expect(tableOptionsStore.tableOptions.selectedDateRange.diffInMonths).toBe(defaultMonthAmount);
		done();
	});
});
