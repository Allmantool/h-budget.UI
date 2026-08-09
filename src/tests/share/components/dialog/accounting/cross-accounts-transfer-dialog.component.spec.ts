/* eslint-disable @typescript-eslint/unbound-method */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatStepper } from '@angular/material/stepper';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { NgxsModule, Store } from '@ngxs/store';
import { Observable, of, Subject, throwError } from 'rxjs';
import { Guid } from 'typescript-guid';

import { CrossAccountsTransferDialogComponent } from '../../../../../app/modules/shared/components/dialog/cross-accounts-transfer/cross-accounts-transfer-dialog.component';
import { DialogContainer } from '../../../../../app/modules/shared/models/dialog-container';
import { ngxsConfig } from '../../../../../app/modules/shared/store/ngxs.config';
import { AccountingOperationsTableState } from '../../../../../app/modules/shared/store/states/accounting/accounting-operations-table.state';
import {
	SetActivePaymentAccount,
	SetInitialPaymentAccounts,
} from '../../../../../app/modules/shared/store/states/accounting/actions/payment-account.actions';
import { PaymentAccountState } from '../../../../../app/modules/shared/store/states/accounting/payment-account.state';
import { AccountingOperationsState } from '../../../../../app/modules/shared/store/states/accounting/payment-operations.state';
import { Result } from '../../../../../core/result';
import { CurrencyExchangeService } from '../../../../../data/providers/rates/currency-exchange.service';
import { AccountTypes } from '../../../../../domain/models/accounting/account-types';
import { ICrossAccountsTransferModel } from '../../../../../domain/models/accounting/cross-accounts-transfer.model';
import { IPaymentAccountModel } from '../../../../../domain/models/accounting/payment-account.model';
import { ICrossAccountsTransferResponse } from '../../../../../domain/models/accounting/responses/cross-accounts-transfer.response';

describe('cross-accounts-transfer-dialog.component', () => {
	const sourceAccountId = Guid.parse('ad8ec3b4-4fa8-4112-80a8-dac1279c4a85');
	const targetAccountId = Guid.parse('c596f11b-d44d-425f-8c90-0655c51318ad');
	const transferOperationId = Guid.parse('24a07833-5cf5-4885-b09d-32c089fac4dd');
	const operationDate = new Date(2024, 0, 11);

	const sourceAccount: IPaymentAccountModel = {
		key: sourceAccountId,
		type: AccountTypes.Virtual,
		currency: 'BYN',
		balance: 100,
		emitter: 'Source bank',
		description: 'Source account',
	};
	const targetAccount: IPaymentAccountModel = {
		key: targetAccountId,
		type: AccountTypes.Virtual,
		currency: 'USD',
		balance: 25,
		emitter: 'Target bank',
		description: 'Target account',
	};

	let fixture: ComponentFixture<CrossAccountsTransferDialogComponent>;
	let component: CrossAccountsTransferDialogComponent;
	let store: Store;
	let dialogRefSpy: jasmine.SpyObj<MatDialogRef<CrossAccountsTransferDialogComponent>>;
	let exchangeServiceSpy: jasmine.SpyObj<CurrencyExchangeService>;
	let submitSpy: jasmine.Spy<
		(payload: ICrossAccountsTransferModel) => Observable<Result<ICrossAccountsTransferResponse>>
	>;

	beforeEach(async () => {
		dialogRefSpy = jasmine.createSpyObj<MatDialogRef<CrossAccountsTransferDialogComponent>>('MatDialogRef', [
			'close',
		]);
		exchangeServiceSpy = jasmine.createSpyObj<CurrencyExchangeService>('exchangeService', {
			getExchangeMultiplier: of(new Result<number>({ isSucceeded: true, payload: 2.5 })),
		});
		submitSpy = jasmine
			.createSpy<
				(payload: ICrossAccountsTransferModel) => Observable<Result<ICrossAccountsTransferResponse>>
			>('onSubmit')
			.and.returnValue(
				of(
					new Result<ICrossAccountsTransferResponse>({
						isSucceeded: true,
						payload: {
							paymentAccountIds: [sourceAccountId, targetAccountId],
							paymentOperationId: transferOperationId,
						},
					})
				)
			);

		await TestBed.configureTestingModule({
			imports: [
				CrossAccountsTransferDialogComponent,
				NoopAnimationsModule,
				NgxsModule.forRoot(
					[PaymentAccountState, AccountingOperationsTableState, AccountingOperationsState],
					ngxsConfig
				),
			],
			providers: [
				{ provide: MatDialogRef, useValue: dialogRefSpy },
				{
					provide: MAT_DIALOG_DATA,
					useValue: {
						title: 'Transfer money',
						onSubmit: submitSpy,
					} as DialogContainer<ICrossAccountsTransferModel, Result<ICrossAccountsTransferResponse>>,
				},
				{ provide: CurrencyExchangeService, useValue: exchangeServiceSpy },
			],
		}).compileComponents();

		store = TestBed.inject(Store);
		store.dispatch(new SetInitialPaymentAccounts([sourceAccount, targetAccount]));
		store.dispatch(new SetActivePaymentAccount(sourceAccountId.toString()));

		fixture = TestBed.createComponent(CrossAccountsTransferDialogComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('opens on transfer details with current account context and no final action', () => {
		const text = getText();

		expect(component.title).toBe('Transfer money');
		expect(component.selectedStepIndexSignal()).toBe(0);
		expect(component.transferDetailsStepFg.controls.transferDirection.value).toBe('In');
		expect(component.transferDetailsStepFg.controls.operationDate.value).toEqual(jasmine.any(Date));
		expect(text).toContain('Current account');
		expect(text).toContain('Source bank');
		expect(text).toContain('Send from current account');
		expect(getButtonsByText('Transfer').length).toBe(0);
	});

	it('maps the existing In and Out values to the correct derived account flow', () => {
		component.transferDetailsStepFg.patchValue({ targetAccountId: targetAccountId.toString() });

		expect(component.fromAccountSignal()?.key?.toString()).toBe(sourceAccountId.toString());
		expect(component.toAccountSignal()?.key?.toString()).toBe(targetAccountId.toString());
		expect(component.counterpartAccountLabelSignal()).toBe('Transfer to *');

		component.transferDetailsStepFg.patchValue({ transferDirection: 'Out' });

		expect(component.fromAccountSignal()?.key?.toString()).toBe(targetAccountId.toString());
		expect(component.toAccountSignal()?.key?.toString()).toBe(sourceAccountId.toString());
		expect(component.counterpartAccountLabelSignal()).toBe('Transfer from *');
	});

	it('excludes the active account from counterpart options and requires transfer details before review', () => {
		const stepperSpy = jasmine.createSpyObj<MatStepper>('MatStepper', ['next']);

		expect(component.availableAccountsSignal().map(account => account.key?.toString())).toEqual([
			targetAccountId.toString(),
		]);

		component.next(stepperSpy);

		expect(stepperSpy.next).not.toHaveBeenCalled();
		expect(component.transferDetailsStepFg.controls.targetAccountId.touched).toBeTrue();
		expect(component.transferDetailsStepFg.controls.transferAmount.touched).toBeTrue();
	});

	it('prepares the multiplier and preserves the incoming request semantics before review', () => {
		const stepperSpy = jasmine.createSpyObj<MatStepper>('MatStepper', ['next']);
		setTransferDetails();

		component.next(stepperSpy);

		expect(exchangeServiceSpy.getExchangeMultiplier).toHaveBeenCalledWith({
			originCurrency: 'BYN',
			targetCurrency: 'USD',
			operationDate,
		});
		expect(component.currencyMultiplierSignal()).toBe(2.5);
		expect(component.destinationAmountSignal()).toBe(25);
		expect(stepperSpy.next).toHaveBeenCalledTimes(1);
	});

	it('shows the current transfer values on review and keeps details when returning', () => {
		setTransferDetails();
		component.currencyMultiplierSignal.set(2.5);
		component.selectedStepIndexSignal.set(1);
		fixture.detectChanges();

		expect(getText()).toContain('Review transfer');
		expect(getText()).toContain('From');
		expect(getText()).toContain('To');
		expect(getText()).toContain('10 BYN');
		expect(getText()).toContain('1 BYN = 2.5 USD');
		expect(getText()).toContain('25 USD');
		expect(component.transferDetailsStepFg.controls.targetAccountId.value).toBe(targetAccountId.toString());
	});

	it('closes after one successful command without waiting for the eventually consistent history lookup', () => {
		setTransferDetails();
		component.currencyMultiplierSignal.set(2.5);

		component.applyTransfer();

		expect(submitSpy).toHaveBeenCalledTimes(1);
		expect(submitSpy).toHaveBeenCalledWith({
			sender: sourceAccountId,
			recipient: targetAccountId,
			amount: 10,
			multiplier: 2.5,
			operationAt: operationDate,
		});
		expect(component.errorMessageSignal()).toBe('');
		expect(dialogRefSpy.close).toHaveBeenCalled();
		expect(component.isLoadingSignal()).toBeFalse();
	});

	it('shows a failure and preserves entered details when the command is rejected', () => {
		setTransferDetails();
		component.currencyMultiplierSignal.set(2.5);
		submitSpy.and.returnValue(of(new Result<ICrossAccountsTransferResponse>({ isSucceeded: false })));

		component.applyTransfer();

		expect(component.isLoadingSignal()).toBeFalse();
		expect(component.errorMessageSignal()).toBe('Unable to complete the transfer. Please try again.');
		expect(dialogRefSpy.close).not.toHaveBeenCalled();
		expect(component.transferDetailsStepFg.getRawValue()).toEqual({
			transferDirection: 'In',
			targetAccountId: targetAccountId.toString(),
			operationDate,
			transferAmount: 10,
		});
	});

	it('does not suggest resubmission when the command outcome is unknown', () => {
		setTransferDetails();
		component.currencyMultiplierSignal.set(2.5);
		submitSpy.and.returnValue(throwError(() => new Error('network failure')));

		component.applyTransfer();

		expect(component.isLoadingSignal()).toBeFalse();
		expect(component.errorMessageSignal()).toBe(
			'We could not confirm whether the transfer was completed. Check your account before submitting another transfer.'
		);
		expect(dialogRefSpy.close).not.toHaveBeenCalled();
		expect(component.transferDetailsStepFg.getRawValue()).toEqual({
			transferDirection: 'In',
			targetAccountId: targetAccountId.toString(),
			operationDate,
			transferAmount: 10,
		});
	});

	it('prevents duplicate submission while a request is still pending', () => {
		const submissionSubject = new Subject<Result<ICrossAccountsTransferResponse>>();
		setTransferDetails();
		component.currencyMultiplierSignal.set(2.5);
		component.selectedStepIndexSignal.set(1);
		fixture.detectChanges();
		submitSpy.and.returnValue(submissionSubject);

		component.applyTransfer();
		component.applyTransfer();
		fixture.detectChanges();

		expect(submitSpy).toHaveBeenCalledTimes(1);
		expect(component.isLoadingSignal()).toBeTrue();
		expect(getButtonsByText('Transferring…')[0].disabled).toBeTrue();
		expect((fixture.nativeElement as HTMLElement).querySelector('mat-progress-bar')).not.toBeNull();

		submissionSubject.error(new Error('network failure'));
		expect(component.isLoadingSignal()).toBeFalse();
	});

	function setTransferDetails(): void {
		component.transferDetailsStepFg.setValue({
			transferDirection: 'In',
			targetAccountId: targetAccountId.toString(),
			operationDate,
			transferAmount: 10,
		});
	}

	function getText(): string {
		return (fixture.nativeElement as HTMLElement).textContent?.replace(/\s+/g, ' ').trim() ?? '';
	}

	function getButtonsByText(text: string): HTMLButtonElement[] {
		return Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('button')).filter(
			button => button.textContent?.replace(/\s+/g, ' ').trim() === text
		);
	}
});
