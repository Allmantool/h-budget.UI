import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute, Router } from '@angular/router';

import { NgxsModule, Store } from '@ngxs/store';
import { of } from 'rxjs';
import { Guid } from 'typescript-guid';

import { ngxsConfig } from '../../../app/modules/shared/store/ngxs.config';
import { SetInitialPaymentAccounts } from '../../../app/modules/shared/store/states/accounting/actions/payment-account.actions';
import { PaymentAccountState } from '../../../app/modules/shared/store/states/accounting/payment-account.state';
import {
	getActivePaymentAccountId,
	getPaymentAccounts,
} from '../../../app/modules/shared/store/states/accounting/selectors/payment-account.selector';
import { DefaultPaymentAccountsProvider } from '../../../data/providers/accounting/payment-accounts.provider';
import { AccountTypes } from '../../../domain/models/accounting/account-types';
import { IPaymentAccountModel } from '../../../domain/models/accounting/payment-account.model';
import { PaymentAccountComponent } from '../../../presentation/accounting/components/payment-account/payment-account.component';
import { PaymentAccountDeletionService } from '../../../presentation/accounting/services/payment-account-deletion.service';
import { PaymentAccountDialogService } from '../../../presentation/accounting/services/payment-account-dialog.service';

describe('payment account component', () => {
	let fixture: ComponentFixture<PaymentAccountComponent>;
	let component: PaymentAccountComponent;
	let store: Store;

	let paymentAccountsProviderSpy: jasmine.SpyObj<DefaultPaymentAccountsProvider>;
	let paymentAccountDialogServiceSpy: jasmine.SpyObj<PaymentAccountDialogService>;
	let paymentAccountDeletionServiceSpy: jasmine.SpyObj<PaymentAccountDeletionService>;
	let routerSpy: jasmine.SpyObj<Router>;

	const accountingWorkspaceRouteStub = {} as ActivatedRoute;
	const providerRouteStub = { parent: accountingWorkspaceRouteStub } as ActivatedRoute;
	const activatedRouteStub = { parent: providerRouteStub } as ActivatedRoute;
	const walletAccountId = '24a07833-5cf5-4885-b09d-32c089fac4dd';
	const virtualAccountId = '0879167a-a6e8-4518-9850-4dd87a4e5be6';
	const loanAccountId = 'fe19b48a-5510-481f-9cde-2fb29c9dd209';
	const creditAccountId = '7cefd1ca-7206-492a-90fc-af1e18151f68';

	let paymentAccounts: IPaymentAccountModel[];

	beforeEach(async () => {
		TestBed.resetTestingModule();
		paymentAccounts = createPaymentAccounts();

		paymentAccountsProviderSpy = jasmine.createSpyObj<DefaultPaymentAccountsProvider>('paymentAccountsProvider', {
			getPaymentAccounts: of(paymentAccounts),
		});
		paymentAccountDialogServiceSpy = jasmine.createSpyObj<PaymentAccountDialogService>(
			'paymentAccountDialogService',
			['openForSave', 'openForUpdate']
		);
		paymentAccountDeletionServiceSpy = jasmine.createSpyObj<PaymentAccountDeletionService>(
			'paymentAccountDeletionService',
			{
				open: of(undefined),
			}
		);
		routerSpy = jasmine.createSpyObj<Router>('router', {
			navigate: Promise.resolve(true),
		});

		await TestBed.configureTestingModule({
			imports: [
				PaymentAccountComponent,
				NoopAnimationsModule,
				NgxsModule.forRoot([PaymentAccountState], ngxsConfig),
			],
			providers: [
				{
					provide: ActivatedRoute,
					useValue: activatedRouteStub,
				},
				{
					provide: Router,
					useValue: routerSpy,
				},
				{
					provide: DefaultPaymentAccountsProvider,
					useValue: paymentAccountsProviderSpy,
				},
				{
					provide: PaymentAccountDialogService,
					useValue: paymentAccountDialogServiceSpy,
				},
				{
					provide: PaymentAccountDeletionService,
					useValue: paymentAccountDeletionServiceSpy,
				},
			],
		}).compileComponents();

		store = TestBed.inject(Store);
		store.reset({
			...store.snapshot(),
			paymentAccounts: {
				activeAccountGuid: '',
				accounts: [],
			},
		});

		fixture = TestBed.createComponent(PaymentAccountComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();

		await fixture.whenStable();
		store.dispatch(new SetInitialPaymentAccounts(paymentAccounts));
		await fixture.whenStable();
		fixture.detectChanges();
	});

	afterEach(() => {
		fixture.destroy();
		TestBed.resetTestingModule();
	});

	it('should create the standalone component and load accounts into NGXS state', () => {
		expect(component).toBeTruthy();
		expect(paymentAccountsProviderSpy.getPaymentAccounts.calls.count()).toBe(1);
		expect(store.selectSnapshot(getPaymentAccounts)).toEqual(paymentAccounts);
		expect(component.totalAccountsCount).toBe(4);
	});

	it('should compile the real template and render compact account groups with balances', () => {
		const pageText = getNativeText();

		expect(pageText).toContain('Accounts');
		expect(getButtonByText('Add account')).not.toBeNull();
		expect(pageText).toContain('4accounts available');
		expect(pageText).toContain('Wallet money');
		expect(pageText).toContain('Virtual accounts');
		expect(pageText).toContain('Loans and credit');
		expect(pageText).toContain('Cash boxPocket cash · USDBalance125.34 USD Open');
		expect(pageText).toContain('Bank cardEveryday account · BYNBalance200.12 BYN Open');
		expect(pageText).toContain('Auto loanLoan balance · EURBalance-50 EUR Open');
		expect(pageText).toContain('Credit cardCard debt · USDBalance-300.25 USD Open');
		expect(getNativeElement().querySelector('.fi-us')).not.toBeNull();
		expect(getNativeElement().querySelector('.fi-by')).not.toBeNull();
		expect(getNativeElement().querySelectorAll('mat-list-option')).toHaveSize(0);
		expect(getActionsTriggers().map(button => button.getAttribute('aria-label'))).toEqual([
			'Actions for Cash box',
			'Actions for Bank card',
			'Actions for Auto loan',
			'Actions for Credit card',
		]);
	});

	it('should render the existing empty account state as zero counts and no options', async () => {
		store.dispatch(new SetInitialPaymentAccounts([]));

		await fixture.whenStable();
		fixture.detectChanges();

		const pageText = getNativeText();

		expect(component.totalAccountsCount).toBe(0);
		expect(pageText).toContain('0accounts available');
		expect(pageText).toContain('No accounts in this group.');
		expect(getAccountRows()).toEqual([]);
	});

	it('should open an account from its row and update the active-account state', async () => {
		await clickOpenAccount('Bank card');

		expect(store.selectSnapshot(getActivePaymentAccountId)).toBe(virtualAccountId);
		expect(routerSpy.navigate.calls.mostRecent().args).toEqual([
			[
				{
					outlets: {
						primary: ['operations'],
					},
				},
			],
			{
				relativeTo: accountingWorkspaceRouteStub,
				queryParams: { paymentAccountId: virtualAccountId },
			},
		]);
	});

	it('should open account dialogs from explicit workspace actions only', async () => {
		getButtonByText('Add account')?.click();

		expect(paymentAccountDialogServiceSpy.openForSave.calls.count()).toBe(1);

		await openActionsMenu('Bank card');
		getOverlayButtonByText('Edit')?.click();

		expect(paymentAccountDialogServiceSpy.openForUpdate.calls.count()).toBe(1);
		expect(paymentAccountDialogServiceSpy.openForUpdate.calls.mostRecent().args).toEqual([virtualAccountId]);
	});

	it('should keep the selected account visually identifiable after its edit action', async () => {
		await openActionsMenu('Bank card');
		getOverlayButtonByText('Edit')?.click();
		fixture.detectChanges();

		expect(store.selectSnapshot(getActivePaymentAccountId)).toBe(virtualAccountId);
		expect(findAccountRow('Bank card')?.classList).toContain('accounts-workspace__account-row--selected');
	});

	it('should expose labeled Edit and Delete account menu items without navigating', async () => {
		await openActionsMenu('Bank card');

		expect(getOverlayButtonByText('Edit')).not.toBeNull();
		expect(getOverlayButtonByText('Delete account')).not.toBeNull();
		expect(routerSpy.navigate.calls.count()).toBe(0);
	});

	it('should delete only the chosen account after confirmed service success and announce it', async () => {
		paymentAccountDeletionServiceSpy.open.and.returnValue(of(paymentAccounts[1]));
		component.selectPaymentAccount(paymentAccounts[1]);

		await openActionsMenu('Bank card');
		getOverlayButtonByText('Delete account')?.click();
		await fixture.whenStable();
		fixture.detectChanges();

		expect(paymentAccountDeletionServiceSpy.open.calls.count()).toBe(1);
		expect(paymentAccountDeletionServiceSpy.open.calls.mostRecent().args).toEqual([paymentAccounts[1]]);
		expect(store.selectSnapshot(getPaymentAccounts).map(account => account.key?.toString())).toEqual([
			walletAccountId,
			loanAccountId,
			creditAccountId,
		]);
		expect(store.selectSnapshot(getActivePaymentAccountId)).toBe('');
		expect(component.totalAccountsCount).toBe(3);
		expect(getNativeText()).toContain('Bank card was deleted.');
		expect(getNativeText()).toContain('Virtual accounts 0 accounts');
	});

	it('should retain the account when deletion is cancelled or fails before success', async () => {
		paymentAccountDeletionServiceSpy.open.and.returnValue(of(undefined));

		await openActionsMenu('Bank card');
		getOverlayButtonByText('Delete account')?.click();
		await fixture.whenStable();

		expect(store.selectSnapshot(getPaymentAccounts)).toEqual(paymentAccounts);
		expect(component.totalAccountsCount).toBe(4);
	});

	it('should navigate to the operations workspace without opening the editor', async () => {
		component.selectPaymentAccount(paymentAccounts[1]);

		await component.navigateToOperations();

		expect(routerSpy.navigate.calls.mostRecent().args).toEqual([
			[
				{
					outlets: {
						primary: ['operations'],
					},
				},
			],
			{
				relativeTo: accountingWorkspaceRouteStub,
				queryParams: { paymentAccountId: virtualAccountId },
			},
		]);
	});

	function createPaymentAccount(
		key: string,
		type: AccountTypes,
		currency: string,
		balance: number,
		emitter: string,
		description: string
	): IPaymentAccountModel {
		return {
			key: Guid.parse(key),
			type,
			currency,
			balance,
			emitter,
			description,
		};
	}

	function createPaymentAccounts(): IPaymentAccountModel[] {
		return [
			createPaymentAccount(walletAccountId, AccountTypes.WalletCache, 'USD', 125.34, 'Cash box', 'Pocket cash'),
			createPaymentAccount(
				virtualAccountId,
				AccountTypes.Virtual,
				'BYN',
				200.12,
				'Bank card',
				'Everyday account'
			),
			createPaymentAccount(loanAccountId, AccountTypes.Loan, 'EUR', -50, 'Auto loan', 'Loan balance'),
			createPaymentAccount(creditAccountId, AccountTypes.Credit, 'USD', -300.25, 'Credit card', 'Card debt'),
		];
	}

	async function clickOpenAccount(accountEmitter: string): Promise<void> {
		const accountRow = findAccountRow(accountEmitter);

		if (accountRow === undefined) {
			throw new Error(`Expected account row '${accountEmitter}' to be rendered.`);
		}

		const openButton = Array.from(accountRow.querySelectorAll<HTMLButtonElement>('button')).find(button =>
			normalizeText(button.textContent ?? '').endsWith('Open')
		);
		openButton?.click();

		await fixture.whenStable();
		fixture.detectChanges();
	}

	function findAccountRow(accountEmitter: string): HTMLElement | undefined {
		return getAccountRows().find(row => normalizeText(row.textContent ?? '').includes(accountEmitter));
	}

	function getAccountRows(): HTMLElement[] {
		return Array.from<HTMLElement>(getNativeElement().querySelectorAll('.accounts-workspace__account-row'));
	}

	async function openActionsMenu(accountEmitter: string): Promise<void> {
		const trigger = getNativeElement().querySelector<HTMLButtonElement>(
			`button[aria-label="Actions for ${accountEmitter}"]`
		);

		if (!trigger) {
			throw new Error(`Expected actions trigger for '${accountEmitter}'.`);
		}

		trigger.click();
		fixture.detectChanges();
		await fixture.whenStable();
	}

	function getActionsTriggers(): HTMLButtonElement[] {
		return Array.from(getNativeElement().querySelectorAll<HTMLButtonElement>('button[aria-label^="Actions for "]'));
	}

	function getOverlayButtonByText(text: string): HTMLButtonElement | null {
		return (
			Array.from(document.body.querySelectorAll<HTMLButtonElement>('.mat-mdc-menu-panel button')).find(button =>
				normalizeText(button.textContent ?? '').endsWith(text)
			) ?? null
		);
	}

	function getButtonByText(text: string): HTMLButtonElement | null {
		return (
			Array.from<HTMLButtonElement>(getNativeElement().querySelectorAll('button')).find(button =>
				normalizeText(button.textContent ?? '').endsWith(text)
			) ?? null
		);
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
