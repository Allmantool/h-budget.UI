import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { NgxsModule, Store } from '@ngxs/store';
import { of } from 'rxjs';
import { Guid } from 'typescript-guid';

import { ngxsConfig } from '../../../app/modules/shared/store/ngxs.config';
import { SetActivePaymentAccount } from '../../../app/modules/shared/store/states/accounting/actions/payment-account.actions';
import { PaymentAccountState } from '../../../app/modules/shared/store/states/accounting/payment-account.state';
import {
	getActivePaymentAccountId,
	getPaymentAccounts,
} from '../../../app/modules/shared/store/states/accounting/selectors/payment-account.selector';
import { Result } from '../../../core/result';
import { DefaultPaymentAccountsProvider } from '../../../data/providers/accounting/payment-accounts.provider';
import { AccountTypes } from '../../../domain/models/accounting/account-types';
import { IPaymentAccountModel } from '../../../domain/models/accounting/payment-account.model';
import { PaymentAccountCrudComponent } from '../../../presentation/accounting/components/payment-account-crud/payment-account-crud.component';
import { PaymentAccountDialogService } from '../../../presentation/accounting/services/payment-account-dialog.service';

describe('payment account CRUD component', () => {
	let fixture: ComponentFixture<PaymentAccountCrudComponent>;
	let component: PaymentAccountCrudComponent;
	let store: Store;

	let paymentAccountDialogServiceSpy: jasmine.SpyObj<PaymentAccountDialogService>;
	let paymentAccountsProviderSpy: jasmine.SpyObj<DefaultPaymentAccountsProvider>;

	const accountId = '24a07833-5cf5-4885-b09d-32c089fac4dd';
	const paymentAccounts = [createPaymentAccount(accountId)];
	const successfulRemoveResult = new Result<boolean>({
		isSucceeded: true,
		payload: true,
	});

	beforeEach(async () => {
		TestBed.resetTestingModule();

		paymentAccountDialogServiceSpy = jasmine.createSpyObj<PaymentAccountDialogService>(
			'paymentAccountDialogService',
			['openForSave', 'openForUpdate']
		);
		paymentAccountsProviderSpy = jasmine.createSpyObj<DefaultPaymentAccountsProvider>('paymentAccountsProvider', {
			removePaymentAccount: of(successfulRemoveResult),
		});

		await TestBed.configureTestingModule({
			imports: [
				PaymentAccountCrudComponent,
				NoopAnimationsModule,
				NgxsModule.forRoot([PaymentAccountState], ngxsConfig),
			],
			providers: [
				{
					provide: PaymentAccountDialogService,
					useValue: paymentAccountDialogServiceSpy,
				},
				{
					provide: DefaultPaymentAccountsProvider,
					useValue: paymentAccountsProviderSpy,
				},
			],
		}).compileComponents();

		store = TestBed.inject(Store);
		resetPaymentAccountState('', paymentAccounts);

		fixture = TestBed.createComponent(PaymentAccountCrudComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
		await fixture.whenStable();
	});

	afterEach(() => {
		fixture.destroy();
		TestBed.resetTestingModule();
	});

	it('should create the standalone component and compile the real template', () => {
		expect(component).toBeTruthy();
		expect(getNativeText()).toContain('add');
		expect(getNativeText()).toContain('delete');
		expect(getNativeText()).toContain('edit');
		expect(getButtonByLabel('Add a payment account')).not.toBeNull();
		expect(getButtonByLabel('Delete the payment account')).not.toBeNull();
		expect(getButtonByLabel('Edit the payment account')).not.toBeNull();
	});

	it('should reflect the existing no-active-account disabled state', () => {
		expect(component.activePaymentAccountGuidSignal()).toBe('');
		expect(component.isAnyPaymentAccountSelected).toBeTrue();
		expect(getMenuItemsWithDisabledState()).toEqual([false, true, true]);
	});

	it('should open the create dialog without requiring a selected account', () => {
		component.createNewPaymentAccount();

		expect(paymentAccountDialogServiceSpy.openForSave.calls.count()).toBe(1);
		expect(paymentAccountDialogServiceSpy.openForUpdate.calls.count()).toBe(0);
	});

	it('should open the update dialog with the active payment account identity', async () => {
		await setActivePaymentAccount(accountId);

		component.updatePaymentAccount();

		expect(paymentAccountDialogServiceSpy.openForUpdate.calls.mostRecent().args).toEqual([accountId]);
	});

	it('should remove the active account after a successful provider response', async () => {
		await setActivePaymentAccount(accountId);

		component.removePaymentAccount();

		expect(paymentAccountsProviderSpy.removePaymentAccount.calls.mostRecent().args).toEqual([accountId]);
		expect(store.selectSnapshot(getActivePaymentAccountId)).toBe(accountId);
		expect(store.selectSnapshot(getPaymentAccounts)).toEqual([]);
	});

	it('should preserve failed-remove behavior by leaving NGXS state unchanged', async () => {
		paymentAccountsProviderSpy.removePaymentAccount.and.returnValue(
			of(
				new Result<boolean>({
					isSucceeded: false,
					payload: false,
				})
			)
		);
		await setActivePaymentAccount(accountId);

		component.removePaymentAccount();

		expect(paymentAccountsProviderSpy.removePaymentAccount.calls.mostRecent().args).toEqual([accountId]);
		expect(store.selectSnapshot(getPaymentAccounts)).toEqual(paymentAccounts);
	});

	async function setActivePaymentAccount(paymentAccountId: string): Promise<void> {
		store.dispatch(new SetActivePaymentAccount(paymentAccountId));
		await fixture.whenStable();
		fixture.detectChanges();
	}

	function resetPaymentAccountState(activeAccountGuid: string, accounts: IPaymentAccountModel[]): void {
		store.reset({
			...store.snapshot(),
			paymentAccounts: {
				activeAccountGuid,
				accounts,
			},
		});
	}

	function createPaymentAccount(key: string): IPaymentAccountModel {
		return {
			key: Guid.parse(key),
			type: AccountTypes.WalletCache,
			currency: 'USD',
			balance: 125.34,
			emitter: 'Cash box',
			description: 'Pocket cash',
		};
	}

	function getMenuItemsWithDisabledState(): boolean[] {
		return Array.from<HTMLElement>(getNativeElement().querySelectorAll('mat-list-item')).map(
			item => item.getAttribute('aria-disabled') === 'true'
		);
	}

	function getButtonByLabel(label: string): HTMLButtonElement | null {
		return getNativeElement().querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`);
	}

	function getNativeText(): string {
		return normalizeText(getNativeElement().textContent ?? '');
	}

	function normalizeText(value: string): string {
		return value.replace(/\s+/g, ' ').trim();
	}

	function getNativeElement(): HTMLElement {
		const nativeElement: unknown = fixture.nativeElement;

		if (!(nativeElement instanceof HTMLElement)) {
			throw new Error('Expected the component fixture to render an HTMLElement.');
		}

		return nativeElement;
	}
});
