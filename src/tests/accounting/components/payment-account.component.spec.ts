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

describe('payment account component', () => {
	let fixture: ComponentFixture<PaymentAccountComponent>;
	let component: PaymentAccountComponent;
	let store: Store;

	let paymentAccountsProviderSpy: jasmine.SpyObj<DefaultPaymentAccountsProvider>;
	let routerSpy: jasmine.SpyObj<Router>;

	const activatedRouteStub = {} as ActivatedRoute;
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

	it('should compile the real template and render account groups with balances', () => {
		const pageText = getNativeText();

		expect(pageText).toContain('Accounts hub');
		expect(pageText).toContain('Total accounts4');
		expect(pageText).toContain('Wallet balance125.34');
		expect(pageText).toContain('Virtual balance200.12');
		expect(pageText).toContain('Loans and credit-350.25');
		expect(pageText).toContain('Wallet money');
		expect(pageText).toContain('Virtual accounts');
		expect(pageText).toContain('Loans');
		expect(pageText).toContain('Cash box | Pocket cash | Balance: 125.34 [USD]');
		expect(pageText).toContain('Bank card | Everyday account | Balance: 200.12 [BYN]');
		expect(pageText).toContain('Auto loan | Loan balance | Balance: -50 [EUR]');
		expect(pageText).toContain('Credit card | Card debt | Balance: -300.25 [USD]');
		expect(getNativeElement().querySelector('.fi-us')).not.toBeNull();
		expect(getNativeElement().querySelector('.fi-by')).not.toBeNull();
	});

	it('should render the existing empty account state as zero counts and no options', async () => {
		store.dispatch(new SetInitialPaymentAccounts([]));

		await fixture.whenStable();
		fixture.detectChanges();

		const pageText = getNativeText();

		expect(component.totalAccountsCount).toBe(0);
		expect(pageText).toContain('Total accounts0');
		expect(pageText).toContain('Wallet balance0');
		expect(pageText).toContain('Virtual balance0');
		expect(pageText).toContain('Loans and credit0');
		expect(getAccountOptions()).toEqual([]);
	});

	it('should select an account, update active-account state, and enable operations navigation', async () => {
		await clickAccountOption('Bank card');

		expect(store.selectSnapshot(getActivePaymentAccountId)).toBe(virtualAccountId);
		expect(component.isNavigateToOperationsDisabled).toBe(false);
		expect(getNavigateButtons().every(button => button.disabled)).toBeFalse();
		expect(findAccountOption('Bank card')?.getAttribute('aria-selected')).toBe('true');
	});

	it('should preserve repeated account selection behavior', async () => {
		await clickAccountOption('Bank card');
		await clickAccountOption('Bank card');

		expect(store.selectSnapshot(getActivePaymentAccountId)).toBe(virtualAccountId);
		expect(component.isNavigateToOperationsDisabled).toBe(false);
		expect(findAccountOption('Bank card')?.getAttribute('aria-selected')).toBe('true');
	});

	it('should navigate to the existing primary and right-sidebar operations outlets', async () => {
		await component.navigateToOperations();

		expect(routerSpy.navigate.calls.mostRecent().args).toEqual([
			[
				{
					outlets: {
						primary: ['operations'],
						right_sidebar: ['operations'],
					},
				},
			],
			{ relativeTo: activatedRouteStub },
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

	async function clickAccountOption(accountEmitter: string): Promise<void> {
		const accountOption = findAccountOption(accountEmitter);

		if (accountOption === undefined) {
			throw new Error(`Expected account option '${accountEmitter}' to be rendered.`);
		}

		accountOption.click();

		await fixture.whenStable();
		fixture.detectChanges();
	}

	function findAccountOption(accountEmitter: string): HTMLElement | undefined {
		return getAccountOptions().find(option => normalizeText(option.textContent ?? '').includes(accountEmitter));
	}

	function getAccountOptions(): HTMLElement[] {
		return Array.from<HTMLElement>(getNativeElement().querySelectorAll('mat-list-option'));
	}

	function getNavigateButtons(): HTMLButtonElement[] {
		return Array.from<HTMLButtonElement>(getNativeElement().querySelectorAll('button')).filter(
			button => normalizeText(button.textContent ?? '') === 'Navigate'
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
