/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { TestBed } from '@angular/core/testing';

import { of } from 'rxjs';

import { DialogProvider } from '../../../app/modules/shared/providers/dialog-provider';
import { DefaultPaymentAccountsProvider } from '../../../data/providers/accounting/payment-accounts.provider';
import { PaymentAccountDialogService } from '../../../presentation/accounting/services/payment-account-dialog.service';

describe('payments account dialog service', () => {
	let sut: PaymentAccountDialogService;

	let paymentAccountsProviderSpy: jasmine.SpyObj<DefaultPaymentAccountsProvider>;
	let dialogProviderSpy: jasmine.SpyObj<DialogProvider>;

	beforeEach(() => {
		paymentAccountsProviderSpy = jasmine.createSpyObj('paymentAccountsProvider', {
			savePaymentAccount: () => of('new id'),
			getById: () => of({}),
			updatePaymentAccount: () => of('upd id'),
		});

		dialogProviderSpy = jasmine.createSpyObj<DialogProvider>('dialogProvider', {
			openDialog: undefined,
		});

		TestBed.configureTestingModule({
			imports: [],
			providers: [
				PaymentAccountDialogService,
				{
					provide: DefaultPaymentAccountsProvider,
					useValue: paymentAccountsProviderSpy,
				},
				{
					provide: DialogProvider,
					useValue: dialogProviderSpy,
				},
			],
		});

		sut = TestBed.inject(PaymentAccountDialogService);
	});

	it('"openPaymentAccountForSave" should execute open dialog', (done: DoneFn) => {
		sut.openPaymentAccountForSave();

		expect(dialogProviderSpy.openDialog).toHaveBeenCalled();
		done();
	});

	it('"openPaymentAccountForUpdate" should should execute open dialog', (done: DoneFn) => {
		sut.openPaymentAccountForUpdate('test payment account id');

		expect(dialogProviderSpy.openDialog).toHaveBeenCalled();
		done();
	});
});
