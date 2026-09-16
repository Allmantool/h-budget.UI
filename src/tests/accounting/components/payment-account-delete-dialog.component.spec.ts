import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { Observable, of, Subject, throwError } from 'rxjs';
import { Guid } from 'typescript-guid';

import { AccountTypes } from '../../../domain/models/accounting/account-types';
import { IPaymentAccountModel } from '../../../domain/models/accounting/payment-account.model';
import { PaymentAccountDeleteDialogComponent } from '../../../presentation/accounting/components/payment-account-delete-dialog/payment-account-delete-dialog.component';
import { PaymentAccountDeleteDialogData } from '../../../presentation/accounting/models/payment-account-delete-dialog-data';

describe('payment account delete dialog', () => {
	const account: IPaymentAccountModel = {
		key: Guid.parse('0879167a-a6e8-4518-9850-4dd87a4e5be6'),
		type: AccountTypes.Virtual,
		currency: 'BYN',
		balance: 200.12,
		emitter: 'Bank card',
		description: 'Everyday account',
	};

	let component: PaymentAccountDeleteDialogComponent;
	let fixture: ComponentFixture<PaymentAccountDeleteDialogComponent>;
	let dialogRefSpy: jasmine.SpyObj<MatDialogRef<PaymentAccountDeleteDialogComponent, IPaymentAccountModel>>;
	let deleteAccountSpy: jasmine.Spy<() => Observable<void>>;

	beforeEach(async () => {
		dialogRefSpy = jasmine.createSpyObj<MatDialogRef<PaymentAccountDeleteDialogComponent, IPaymentAccountModel>>(
			'dialogRef',
			['close']
		);
		Object.defineProperty(dialogRefSpy, 'disableClose', { value: false, writable: true });
		deleteAccountSpy = jasmine.createSpy<() => Observable<void>>('deleteAccount').and.returnValue(of(undefined));

		await TestBed.configureTestingModule({
			imports: [PaymentAccountDeleteDialogComponent, NoopAnimationsModule],
			providers: [
				{ provide: MatDialogRef, useValue: dialogRefSpy },
				{
					provide: MAT_DIALOG_DATA,
					useValue: { account, deleteAccount: deleteAccountSpy } as PaymentAccountDeleteDialogData,
				},
			],
		}).compileComponents();

		fixture = TestBed.createComponent(PaymentAccountDeleteDialogComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should present semantic account context and labeled safe/destructive actions', () => {
		const text = normalizedText();
		const buttons = getButtons();

		expect(text).toContain('Delete payment account?');
		expect(text).toContain('Bank card');
		expect(text).toContain('CurrencyBYN');
		expect(text).toContain('Current balance200.12 BYN');
		expect(text).toContain('This account will be removed from Home Ledger.');
		expect(buttons.map(button => button.textContent?.trim())).toEqual(['Cancel', 'Delete account']);
		expect(getNativeElement().querySelector('[role="alert"]')).toBeNull();
	});

	it('should cancel without issuing a delete request', () => {
		getButtonByText('Cancel')?.click();

		expect(deleteAccountSpy).not.toHaveBeenCalled();
	});

	it('should disable dismissal and prevent duplicate submission while deletion is pending', () => {
		const deletion = new Subject<void>();
		deleteAccountSpy.and.returnValue(deletion);

		component.confirm();
		component.confirm();
		fixture.detectChanges();

		expect(deleteAccountSpy).toHaveBeenCalledTimes(1);
		expect(component.isDeletingSignal()).toBeTrue();
		expect(dialogRefSpy.disableClose).toBeTrue();
		expect(getButtonByText('Deleting…')?.disabled).toBeTrue();
		expect(dialogRefSpy.close.calls.count()).toBe(0);

		deletion.next();
		deletion.complete();

		expect(dialogRefSpy.close.calls.count()).toBe(1);
		expect(dialogRefSpy.close.calls.mostRecent().args).toEqual([account]);
	});

	it('should retain context, show the failure, and permit a safe retry', () => {
		deleteAccountSpy.and.returnValue(throwError(() => new Error('This account could not be deleted. Try again.')));

		component.confirm();
		fixture.detectChanges();

		expect(component.isDeletingSignal()).toBeFalse();
		expect(dialogRefSpy.disableClose).toBeFalse();
		expect(dialogRefSpy.close.calls.count()).toBe(0);
		expect(normalizedText()).toContain('This account could not be deleted. Try again.');
		expect(getButtonByText('Delete account')?.disabled).toBeFalse();

		deleteAccountSpy.and.returnValue(of(undefined));
		component.confirm();

		expect(deleteAccountSpy).toHaveBeenCalledTimes(2);
		expect(dialogRefSpy.close.calls.count()).toBe(1);
		expect(dialogRefSpy.close.calls.mostRecent().args).toEqual([account]);
	});

	function getButtonByText(text: string): HTMLButtonElement | undefined {
		return getButtons().find(button => button.textContent?.trim() === text);
	}

	function getButtons(): HTMLButtonElement[] {
		return Array.from(getNativeElement().querySelectorAll<HTMLButtonElement>('button'));
	}

	function normalizedText(): string {
		return (getNativeElement().textContent ?? '').replace(/\s+/g, ' ').trim();
	}

	function getNativeElement(): HTMLElement {
		return fixture.nativeElement as HTMLElement;
	}
});
