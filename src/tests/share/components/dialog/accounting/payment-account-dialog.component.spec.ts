/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { NgxsModule, Store } from '@ngxs/store';
import { Observable, of } from 'rxjs';
import { Guid } from 'typescript-guid';

import { PaymentAccountDialogComponent } from '../../../../../app/modules/shared/components/dialog/payment-account/payment-account-dialog.component';
import { DialogContainer } from '../../../../../app/modules/shared/models/dialog-container';
import { DialogOperationTypes } from '../../../../../app/modules/shared/models/dialog-operation-types';
import { DialogProvider } from '../../../../../app/modules/shared/providers/dialog-provider';
import { ngxsConfig } from '../../../../../app/modules/shared/store/ngxs.config';
import {
	AddPaymentAccount,
	SetActivePaymentAccount,
	SetInitialPaymentAccounts,
	UpdatePaymentAccount,
} from '../../../../../app/modules/shared/store/states/accounting/actions/payment-account.actions';
import { PaymentAccountState } from '../../../../../app/modules/shared/store/states/accounting/payment-account.state';
import { Result } from '../../../../../core/result';
import { DefaultPaymentAccountsProvider } from '../../../../../data/providers/accounting/payment-accounts.provider';
import { AccountTypes } from '../../../../../domain/models/accounting/account-types';
import { IPaymentAccountModel } from '../../../../../domain/models/accounting/payment-account.model';
import { PaymentAccountDialogService } from '../../../../../presentation/accounting/services/payment-account-dialog.service';

describe('payment-account-dialog.component', () => {
	const existingAccountId = Guid.parse('bb6d182f-8b99-4e09-aa24-319b181178e3');
	const existingAccount: IPaymentAccountModel = {
		key: existingAccountId,
		type: AccountTypes.Loan,
		currency: 'USD',
		balance: 11.2,
		emitter: 'test-emitter',
		description: 'test-description',
	};

	const savedAccount: IPaymentAccountModel = {
		key: Guid.parse('cfed08e4-5a64-4935-a073-7c0a2a2f8e7a'),
		type: AccountTypes.Credit,
		currency: 'BYN',
		balance: 42.75,
		emitter: 'saved-emitter',
		description: 'saved-description',
	};

	let component: PaymentAccountDialogComponent;
	let fixture: ComponentFixture<PaymentAccountDialogComponent>;
	let store: Store;
	let sut: PaymentAccountDialogService;

	let dialogRefSpy: jasmine.SpyObj<MatDialogRef<PaymentAccountDialogComponent>>;
	let dialogProviderSpy: jasmine.SpyObj<DialogProvider>;
	let paymentAccountsProviderSpy: jasmine.SpyObj<DefaultPaymentAccountsProvider>;
	let submitSpy: jasmine.Spy<
		(operationResult: Result<IPaymentAccountModel>) => Observable<Result<IPaymentAccountModel>>
	>;

	async function configureComponent(
		dialogConfiguration: Partial<DialogContainer<Result<IPaymentAccountModel>, Result<IPaymentAccountModel>>> = {},
		paymentAccounts: IPaymentAccountModel[] = [],
		activePaymentAccountId: string = ''
	): Promise<void> {
		dialogRefSpy = jasmine.createSpyObj<MatDialogRef<PaymentAccountDialogComponent>>('MatDialogRef', ['close']);

		dialogProviderSpy = jasmine.createSpyObj<DialogProvider>('dialogProvider', {
			openDialog: undefined,
		});

		paymentAccountsProviderSpy = jasmine.createSpyObj<DefaultPaymentAccountsProvider>('paymentAccountsProvider', {
			savePaymentAccount: of(new Result<string>({ payload: savedAccount.key!.toString(), isSucceeded: true })),
			getById: of(savedAccount),
			updatePaymentAccount: of(new Result<string>({ payload: savedAccount.key!.toString(), isSucceeded: true })),
		});

		submitSpy = jasmine
			.createSpy<
				(operationResult: Result<IPaymentAccountModel>) => Observable<Result<IPaymentAccountModel>>
			>('onSubmit')
			.and.returnValue(of(new Result<IPaymentAccountModel>({ payload: savedAccount, isSucceeded: true })));

		await TestBed.configureTestingModule({
			imports: [
				PaymentAccountDialogComponent,
				NoopAnimationsModule,
				NgxsModule.forRoot([PaymentAccountState], ngxsConfig),
			],
			providers: [
				PaymentAccountDialogService,
				{
					provide: MatDialogRef,
					useValue: dialogRefSpy,
				},
				{
					provide: MAT_DIALOG_DATA,
					useValue: {
						title: 'Payment account: (Add new)',
						onSubmit: submitSpy,
						...dialogConfiguration,
					} as DialogContainer<Result<IPaymentAccountModel>, Result<IPaymentAccountModel>>,
				},
				{
					provide: DialogProvider,
					useValue: dialogProviderSpy,
				},
				{
					provide: DefaultPaymentAccountsProvider,
					useValue: paymentAccountsProviderSpy,
				},
			],
		}).compileComponents();

		store = TestBed.inject(Store);
		store.dispatch(new SetInitialPaymentAccounts(paymentAccounts));

		if (activePaymentAccountId !== '') {
			store.dispatch(new SetActivePaymentAccount(activePaymentAccountId));
		}

		sut = TestBed.inject(PaymentAccountDialogService);
		fixture = TestBed.createComponent(PaymentAccountDialogComponent);
		component = fixture.componentInstance;
	}

	it('should create as a standalone TestBed import with the existing form structure and initial values', async () => {
		await configureComponent();

		fixture.detectChanges();

		expect(component).toBeTruthy();
		expect(component.title).toBe('Payment account: (Add new)');
		expect(component.accountTypeStepFg.contains('accountTypeCtrl')).toBeTrue();
		expect(component.currencyStepFg.contains('currencyCtrl')).toBeTrue();
		expect(component.balanceStepFg.contains('balanceCtrl')).toBeTrue();
		expect(component.additionalInfoStepFg.contains('emitterCtrl')).toBeTrue();
		expect(component.additionalInfoStepFg.contains('descriptionCtrl')).toBeTrue();
		expect(component.accountTypeStepFg.get('accountTypeCtrl')?.value).toBe('WalletCache');
		expect(component.currencyStepFg.get('currencyCtrl')?.value).toBe('USD');
		expect(component.balanceStepFg.get('balanceCtrl')?.value).toBe(0);
		expect(component.additionalInfoStepFg.get('emitterCtrl')?.value).toBe('');
		expect(component.additionalInfoStepFg.get('descriptionCtrl')?.value).toBe('');
	});

	it('should preserve the current no-validator form eligibility and opening balance behavior', async () => {
		await configureComponent();

		component.balanceStepFg.get('balanceCtrl')?.setValue(-100);
		component.additionalInfoStepFg.reset();

		expect(component.accountTypeStepFg.valid).toBeTrue();
		expect(component.currencyStepFg.valid).toBeTrue();
		expect(component.balanceStepFg.valid).toBeTrue();
		expect(component.additionalInfoStepFg.valid).toBeTrue();
	});

	it('should patch existing payment account data in update mode', async () => {
		await configureComponent(
			{
				title: 'Payment account: (Update)',
				operationType: DialogOperationTypes.Update,
			},
			[existingAccount],
			existingAccountId.toString()
		);

		expect(component.title).toBe('Payment account: (Update)');
		expect(component.accountTypeStepFg.get('accountTypeCtrl')?.value).toEqual(
			jasmine.objectContaining({ value: 'Loan' })
		);
		expect(component.currencyStepFg.get('currencyCtrl')?.value).toBe('USD');
		expect(component.balanceStepFg.get('balanceCtrl')?.value).toBe(11.2);
		expect(component.additionalInfoStepFg.get('emitterCtrl')?.value).toBe('test-emitter');
		expect(component.additionalInfoStepFg.get('descriptionCtrl')?.value).toBe('test-description');
	});

	it('should submit the create payload, dispatch the added account, reset loading, and close', async () => {
		await configureComponent();
		const dispatchSpy = spyOn(store, 'dispatch').and.callThrough();

		component.accountTypeStepFg.get('accountTypeCtrl')?.setValue(component.getAccountsTypes()[AccountTypes.Credit]);
		component.currencyStepFg.get('currencyCtrl')?.setValue(component.getCurrencyTypes()[1]);
		component.balanceStepFg.get('balanceCtrl')?.setValue(42.75);
		component.additionalInfoStepFg.patchValue({
			emitterCtrl: 'saved-emitter',
			descriptionCtrl: 'saved-description',
		});

		component.applyChanges();

		expect(submitSpy).toHaveBeenCalledWith(
			jasmine.objectContaining({
				isSucceeded: true,
				payload: {
					type: AccountTypes.Credit,
					currency: 'BYN',
					balance: 42.75,
					emitter: 'saved-emitter',
					description: 'saved-description',
				},
			})
		);
		expect(dispatchSpy.calls.mostRecent().args[0]).toEqual(new AddPaymentAccount(savedAccount));
		expect(component.isLoadingSignal()).toBeFalse();
		expect(dialogRefSpy.close).toHaveBeenCalled();
	});

	it('should dispatch an updated account in update mode', async () => {
		await configureComponent(
			{
				operationType: DialogOperationTypes.Update,
			},
			[existingAccount],
			existingAccountId.toString()
		);
		const dispatchSpy = spyOn(store, 'dispatch').and.callThrough();

		component.accountTypeStepFg.get('accountTypeCtrl')?.setValue(component.getAccountsTypes()[AccountTypes.Credit]);
		component.currencyStepFg.get('currencyCtrl')?.setValue(component.getCurrencyTypes()[1]);

		component.applyChanges();

		expect(dispatchSpy.calls.mostRecent().args[0]).toEqual(new UpdatePaymentAccount(savedAccount));
		expect(component.isLoadingSignal()).toBeFalse();
		expect(dialogRefSpy.close).toHaveBeenCalled();
	});

	it('should close the dialog on cancel', async () => {
		await configureComponent();

		component.close();

		expect(dialogRefSpy.close).toHaveBeenCalled();
	});

	it('should keep the dialog service opening this standalone component through DialogProvider', async () => {
		await configureComponent();

		sut.openForSave();

		expect(dialogProviderSpy.openDialog).toHaveBeenCalledWith(
			PaymentAccountDialogComponent,
			jasmine.objectContaining({ disableClose: true })
		);
	});
});
