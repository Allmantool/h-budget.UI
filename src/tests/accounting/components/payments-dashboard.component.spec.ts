import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { NgxsModule, Store } from '@ngxs/store';
import { of, Subject } from 'rxjs';
import { Guid } from 'typescript-guid';

import { ngxsConfig } from '../../../app/modules/shared/store/ngxs.config';
import { AccountingOperationsTableState } from '../../../app/modules/shared/store/states/accounting/accounting-operations-table.state';
import { SetActiveAccountingOperation } from '../../../app/modules/shared/store/states/accounting/actions/accounting-table-options.actions';
import {
	SetActivePaymentAccount,
	SetInitialPaymentAccounts,
} from '../../../app/modules/shared/store/states/accounting/actions/payment-account.actions';
import { SetInitialPaymentOperations } from '../../../app/modules/shared/store/states/accounting/actions/payment-operation.actions';
import { PaymentAccountState } from '../../../app/modules/shared/store/states/accounting/payment-account.state';
import { AccountingOperationsState } from '../../../app/modules/shared/store/states/accounting/payment-operations.state';
import { getAccountingTableOptions } from '../../../app/modules/shared/store/states/accounting/selectors/table-options.selectors';
import { AccountTypes } from '../../../domain/models/accounting/account-types';
import { IPaymentAccountModel } from '../../../domain/models/accounting/payment-account.model';
import { IPaymentOperationModel } from '../../../domain/models/accounting/payment-operation.model';
import { OperationTypes } from '../../../domain/types/operation.types';
import { AccountNotification } from '../../../infrastructure/account-notification';
import { SseService } from '../../../infrastructure/sse-service';
import { PaymentsDashboardComponent } from '../../../presentation/accounting/components/payments-dashboard/payments-dashboard.component';
import { IPaymentRepresentationModel } from '../../../presentation/accounting/models/operation-record';
import { AccountsService } from '../../../presentation/accounting/services/accounts.service';
import { CrossAccountsTransferService } from '../../../presentation/accounting/services/cross-accounts-transfer.dialog.service';
import { HandbooksService } from '../../../presentation/accounting/services/handbooks.service';
import { PaymentsHistoryService } from '../../../presentation/accounting/services/payments-history.service';

describe('payments dashboard component', () => {
	let fixture: ComponentFixture<PaymentsDashboardComponent>;
	let component: PaymentsDashboardComponent;
	let store: Store;
	let router: Router;

	let accountsTransferServiceSpy: jasmine.SpyObj<CrossAccountsTransferService>;
	let handbooksServiceSpy: jasmine.SpyObj<HandbooksService>;
	let paymentsHistoryServiceSpy: jasmine.SpyObj<PaymentsHistoryService>;
	let accountsServiceSpy: jasmine.SpyObj<AccountsService>;
	let sseServiceSpy: jasmine.SpyObj<SseService>;
	let notificationsSubject: Subject<AccountNotification>;

	const activeAccountId = '24a07833-5cf5-4885-b09d-32c089fac4dd';
	const activeOperationId = Guid.parse('0879167a-a6e8-4518-9850-4dd87a4e5be6');

	const activeAccount: IPaymentAccountModel = {
		key: Guid.parse(activeAccountId),
		type: AccountTypes.Virtual,
		currency: 'BYN',
		balance: 64.5,
		emitter: 'Primary wallet',
		description: 'Household budget',
	};

	const paymentOperations: IPaymentOperationModel[] = [
		createPaymentOperation(100, new Date(2024, 0, 15)),
		createPaymentOperation(-25.5, new Date(2024, 0, 16)),
		createPaymentOperation(-10, new Date(2099, 0, 1)),
	];

	const historyRows: IPaymentRepresentationModel[] = [
		{
			key: activeOperationId,
			operationDate: new Date(2024, 0, 15),
			contractor: 'test contractor',
			category: 'salary',
			income: 100,
			expense: 0,
			comment: 'income-comment',
			balance: 100,
			operationType: OperationTypes.Payment,
		},
	];

	beforeEach(async () => {
		accountsTransferServiceSpy = jasmine.createSpyObj<CrossAccountsTransferService>('accountsTransferService', [
			'openForTransfer',
		]);
		handbooksServiceSpy = jasmine.createSpyObj<HandbooksService>('handbooksService', ['setupHandbooksStore']);
		paymentsHistoryServiceSpy = jasmine.createSpyObj<PaymentsHistoryService>('paymentsHistoryService', {
			refreshPaymentsHistory: of(historyRows),
		});
		accountsServiceSpy = jasmine.createSpyObj<AccountsService>('accountsService', {
			refreshAccounts: undefined,
		});
		notificationsSubject = new Subject<AccountNotification>();
		sseServiceSpy = jasmine.createSpyObj<SseService>('sseService', ['connect', 'disconnect'], {
			notifications$: notificationsSubject.asObservable(),
		});

		await TestBed.configureTestingModule({
			imports: [
				PaymentsDashboardComponent,
				NgxsModule.forRoot(
					[AccountingOperationsState, AccountingOperationsTableState, PaymentAccountState],
					ngxsConfig
				),
			],
			providers: [
				provideRouter([]),
				{
					provide: CrossAccountsTransferService,
					useValue: accountsTransferServiceSpy,
				},
				{
					provide: HandbooksService,
					useValue: handbooksServiceSpy,
				},
				{
					provide: PaymentsHistoryService,
					useValue: paymentsHistoryServiceSpy,
				},
				{
					provide: AccountsService,
					useValue: accountsServiceSpy,
				},
				{
					provide: SseService,
					useValue: sseServiceSpy,
				},
			],
		}).compileComponents();

		store = TestBed.inject(Store);
		router = TestBed.inject(Router);

		store.dispatch(new SetInitialPaymentAccounts([activeAccount]));
		store.dispatch(new SetActivePaymentAccount(activeAccountId));
		store.dispatch(new SetInitialPaymentOperations(paymentOperations));

		fixture = TestBed.createComponent(PaymentsDashboardComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();

		await fixture.whenStable();
		fixture.detectChanges();
	});

	afterEach(() => {
		fixture.destroy();
		notificationsSubject.complete();
	});

	it('should create the standalone dashboard and render the standalone history child', () => {
		expect(component).toBeTruthy();
		expect(getNativeElement().querySelector('payments-history')).not.toBeNull();
		expect(getNativeText()).toContain('Transactions timeline');
	});

	it('should render dashboard actions in the existing order', () => {
		expect(getActionButtonTexts()).toEqual(['Money transfer', 'Change account']);
	});

	it('should render active account details and preserve operation summary calculations', () => {
		const summary = component.accountingSummarySignal();
		const pageText = getNativeText();

		expect(pageText).toContain('Primary wallet');
		expect(pageText).toContain('Household budget · BYN');
		expect(summary).toEqual({
			operationsCount: 3,
			settledCount: 2,
			scheduledCount: 1,
			income: 100,
			expense: 35.5,
			net: 64.5,
		});
	});

	it('should invoke the existing transfer workflow from the money transfer action', () => {
		getActionButtons()[0].click();

		expect(accountsTransferServiceSpy.openForTransfer.calls.count()).toBe(1);
	});

	it('should clear the active operation and navigate to payment accounts when changing account', async () => {
		const navigateSpy = spyOn(router, 'navigate').and.resolveTo(true);

		store.dispatch(new SetActiveAccountingOperation(activeOperationId));

		await component.navigateToPaymentAccountsAsync();

		expect(store.selectSnapshot(getAccountingTableOptions).selectedRecordGuid).toBeUndefined();
		expect(navigateSpy.calls.mostRecent().args).toEqual([['/dashboard/accounting'], { relativeTo: null }]);
	});

	it('should safely return to account selection when operations initialize without an active account', async () => {
		const navigateSpy = spyOn(router, 'navigate').and.resolveTo(true);

		fixture.destroy();
		store.reset({
			...store.snapshot(),
			paymentAccounts: {
				activeAccountGuid: '',
				accounts: [],
			},
		});
		paymentsHistoryServiceSpy.refreshPaymentsHistory.calls.reset();

		fixture = TestBed.createComponent(PaymentsDashboardComponent);
		component = fixture.componentInstance;

		expect(() => fixture.detectChanges()).not.toThrow();

		await fixture.whenStable();
		fixture.detectChanges();

		expect(navigateSpy.calls.mostRecent().args).toEqual([['/dashboard/accounting'], { relativeTo: null }]);
		expect(getNativeText()).toContain('Select a payment account');
		expect(getNativeElement().querySelector('payments-history')).toBeNull();
		expect(paymentsHistoryServiceSpy.refreshPaymentsHistory.calls.count()).toBe(0);
	});

	function createPaymentOperation(amount: number, operationDate: Date): IPaymentOperationModel {
		return {
			key: Guid.create(),
			paymentAccountId: Guid.parse(activeAccountId),
			contractorId: Guid.EMPTY,
			categoryId: Guid.EMPTY,
			operationDate,
			comment: '',
			amount,
			operationType: OperationTypes.Payment,
		};
	}

	function getActionButtonTexts(): string[] {
		return getActionButtons().map(button => normalizeText(button.textContent ?? ''));
	}

	function getActionButtons(): HTMLButtonElement[] {
		return Array.from<HTMLButtonElement>(
			getNativeElement().querySelectorAll('.payments-dashboard__actions button')
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
