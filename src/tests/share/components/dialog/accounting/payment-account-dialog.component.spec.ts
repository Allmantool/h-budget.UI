/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatStepper } from '@angular/material/stepper';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { NgxsModule, Store } from '@ngxs/store';
import { Observable, of, Subject, throwError } from 'rxjs';
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
	let service: PaymentAccountDialogService;
	let dialogRefSpy: jasmine.SpyObj<MatDialogRef<PaymentAccountDialogComponent>>;
	let dialogProviderSpy: jasmine.SpyObj<DialogProvider>;
	let submitSpy: jasmine.Spy<
		(operationResult: Result<IPaymentAccountModel>) => Observable<Result<IPaymentAccountModel>>
	>;

	async function configureComponent(
		dialogConfiguration: Partial<DialogContainer<Result<IPaymentAccountModel>, Result<IPaymentAccountModel>>> = {},
		paymentAccounts: IPaymentAccountModel[] = [],
		activePaymentAccountId: string = ''
	): Promise<void> {
		dialogRefSpy = jasmine.createSpyObj<MatDialogRef<PaymentAccountDialogComponent>>('MatDialogRef', ['close']);
		dialogProviderSpy = jasmine.createSpyObj<DialogProvider>('dialogProvider', { openDialog: undefined });
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
				{ provide: MatDialogRef, useValue: dialogRefSpy },
				{
					provide: MAT_DIALOG_DATA,
					useValue: {
						title: 'Add payment account',
						onSubmit: submitSpy,
						...dialogConfiguration,
					} as DialogContainer<Result<IPaymentAccountModel>, Result<IPaymentAccountModel>>,
				},
				{ provide: DialogProvider, useValue: dialogProviderSpy },
				{
					provide: DefaultPaymentAccountsProvider,
					useValue: jasmine.createSpyObj<DefaultPaymentAccountsProvider>('paymentAccountsProvider', {
						savePaymentAccount: of(
							new Result<string>({ payload: savedAccount.key!.toString(), isSucceeded: true })
						),
						getById: of(savedAccount),
						updatePaymentAccount: of(
							new Result<string>({ payload: savedAccount.key!.toString(), isSucceeded: true })
						),
					}),
				},
			],
		}).compileComponents();

		store = TestBed.inject(Store);
		store.dispatch(new SetInitialPaymentAccounts(paymentAccounts));
		if (activePaymentAccountId !== '') {
			store.dispatch(new SetActivePaymentAccount(activePaymentAccountId));
		}

		service = TestBed.inject(PaymentAccountDialogService);
		fixture = TestBed.createComponent(PaymentAccountDialogComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	}

	function getStepper(): MatStepper {
		return fixture.debugElement.query(de => de.componentInstance instanceof MatStepper)
			.componentInstance as MatStepper;
	}

	function getRenderedText(): string {
		return (fixture.nativeElement as HTMLElement).textContent ?? '';
	}

	it('opens on the compact three-step workflow with required account details and optional notes', async () => {
		await configureComponent();

		expect(component).toBeTruthy();
		expect(component.selectedStepIndexSignal()).toBe(0);
		expect(component.accountDetailsStepFg.contains('accountTypeCtrl')).toBeTrue();
		expect(component.accountDetailsStepFg.contains('currencyCtrl')).toBeTrue();
		expect(component.accountDetailsStepFg.contains('balanceCtrl')).toBeTrue();
		expect(component.additionalInfoStepFg.valid).toBeTrue();
		expect(getRenderedText()).toContain('Review & create');
		expect(getRenderedText()).toContain('Next');
	});

	it('prevents progression when account details are invalid and marks the affected fields as touched', async () => {
		await configureComponent();
		const stepper = getStepper();
		component.accountDetailsStepFg.patchValue({ accountTypeCtrl: null, currencyCtrl: null, balanceCtrl: null });

		component.next(stepper);

		expect(stepper.selectedIndex).toBe(0);
		expect(component.accountDetailsStepFg.controls.accountTypeCtrl.touched).toBeTrue();
		expect(component.accountDetailsStepFg.controls.currencyCtrl.touched).toBeTrue();
		expect(component.accountDetailsStepFg.controls.balanceCtrl.touched).toBeTrue();
	});

	it('retains valid account details and optional data while navigating back and forward', async () => {
		await configureComponent();
		const stepper = getStepper();
		component.accountDetailsStepFg.patchValue({
			accountTypeCtrl: component.getAccountsTypes()[AccountTypes.Credit],
			currencyCtrl: component.getCurrencyTypes()[1],
			balanceCtrl: 42.75,
		});

		component.next(stepper);
		component.additionalInfoStepFg.patchValue({
			emitterCtrl: 'saved-emitter',
			descriptionCtrl: 'saved-description',
		});
		component.previous(stepper);

		expect(stepper.selectedIndex).toBe(0);
		expect(component.accountDetailsStepFg.controls.balanceCtrl.value).toBe(42.75);
		component.next(stepper);
		component.next(stepper);

		expect(stepper.selectedIndex).toBe(2);
		expect(component.additionalInfoSignal()).toBe('saved-emitter | saved-description');
		expect(component.currencyDescriptionSignal()).toBe('BYN — Belarusian ruble');
	});

	it('shows each review value separately and edits the matching step without losing form state', async () => {
		await configureComponent();
		const stepper = getStepper();
		component.accountDetailsStepFg.patchValue({ balanceCtrl: 12.5 });
		component.next(stepper);
		component.next(stepper);
		fixture.detectChanges();

		expect(getRenderedText()).toContain('Account type');
		expect(getRenderedText()).toContain('Currency');
		expect(getRenderedText()).toContain('Initial balance');
		expect(getRenderedText()).toContain('Additional information');
		expect(getRenderedText()).toContain('Not provided');

		component.editStep(stepper, 0);

		expect(stepper.selectedIndex).toBe(0);
		expect(component.accountDetailsStepFg.controls.balanceCtrl.value).toBe(12.5);
	});

	it('preserves the existing create request, dispatches once, and prevents duplicate submissions while pending', async () => {
		await configureComponent();
		const submission = new Subject<Result<IPaymentAccountModel>>();
		submitSpy.and.returnValue(submission);
		const dispatchSpy = spyOn(store, 'dispatch').and.callThrough();
		component.accountDetailsStepFg.patchValue({
			accountTypeCtrl: component.getAccountsTypes()[AccountTypes.Credit],
			currencyCtrl: component.getCurrencyTypes()[1],
			balanceCtrl: '42.75',
		});
		component.additionalInfoStepFg.patchValue({
			emitterCtrl: 'saved-emitter',
			descriptionCtrl: 'saved-description',
		});

		component.applyChanges();
		component.applyChanges();

		expect(submitSpy).toHaveBeenCalledTimes(1);
		expect(submitSpy).toHaveBeenCalledWith(
			jasmine.objectContaining({
				payload: {
					type: AccountTypes.Credit,
					currency: 'BYN',
					balance: 42.75,
					emitter: 'saved-emitter',
					description: 'saved-description',
				},
			})
		);

		submission.next(new Result<IPaymentAccountModel>({ payload: savedAccount, isSucceeded: true }));
		submission.complete();

		expect(dispatchSpy.calls.mostRecent().args[0]).toEqual(new AddPaymentAccount(savedAccount));
		expect(dialogRefSpy.close).toHaveBeenCalled();
		expect(component.isLoadingSignal()).toBeFalse();
	});

	it('keeps entered values and enables a retry when submission fails', async () => {
		await configureComponent();
		submitSpy.and.returnValue(throwError(() => new Error('Request failed')));
		component.accountDetailsStepFg.patchValue({ balanceCtrl: 42.75 });
		component.additionalInfoStepFg.patchValue({ emitterCtrl: 'saved-emitter' });

		component.applyChanges();

		expect(component.isLoadingSignal()).toBeFalse();
		expect(component.accountDetailsStepFg.controls.balanceCtrl.value).toBe(42.75);
		expect(component.additionalInfoStepFg.controls.emitterCtrl.value).toBe('saved-emitter');
		expect(dialogRefSpy.close).not.toHaveBeenCalled();
	});

	it('patches existing account data and retains update dispatch semantics', async () => {
		await configureComponent(
			{ operationType: DialogOperationTypes.Update },
			[existingAccount],
			existingAccountId.toString()
		);
		const dispatchSpy = spyOn(store, 'dispatch').and.callThrough();

		expect(component.title).toBe('Add payment account');
		expect(component.accountDetailsStepFg.controls.accountTypeCtrl.value).toEqual(
			jasmine.objectContaining({ value: 'Loan' })
		);
		expect(component.accountDetailsStepFg.controls.currencyCtrl.value).toBe('USD');
		expect(component.accountDetailsStepFg.controls.balanceCtrl.value).toBe(11.2);

		component.applyChanges();

		expect(dispatchSpy.calls.mostRecent().args[0]).toEqual(new UpdatePaymentAccount(savedAccount));
		expect(dialogRefSpy.close).toHaveBeenCalled();
	});

	it('closes on cancel and keeps the dialog service integration intact', async () => {
		await configureComponent();
		component.close();
		service.openForSave();

		expect(dialogRefSpy.close).toHaveBeenCalled();
		expect(dialogProviderSpy.openDialog).toHaveBeenCalledWith(
			PaymentAccountDialogComponent,
			jasmine.objectContaining({ disableClose: true })
		);
	});
});
