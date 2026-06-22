import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MapperModule } from '@dynamic-mapper/angular';
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
import { PaymentAccountState } from '../../../app/modules/shared/store/states/accounting/payment-account.state';
import { AccountingOperationsState } from '../../../app/modules/shared/store/states/accounting/payment-operations.state';
import { getAccountingTableOptions } from '../../../app/modules/shared/store/states/accounting/selectors/table-options.selectors';
import { CategoriesState } from '../../../app/modules/shared/store/states/handbooks/categories.state';
import { ContractorsState } from '../../../app/modules/shared/store/states/handbooks/contractors.state';
import { HandbooksState } from '../../../app/modules/shared/store/states/handbooks/handbooks.state';
import { DefaultCategoriesProvider } from '../../../data/providers/accounting/categories.provider';
import { DefaultContractorsProvider } from '../../../data/providers/accounting/contractors.provider';
import { DataCategoryProfile } from '../../../data/providers/accounting/mappers/category.mapping.profile';
import { DataContractorProfile } from '../../../data/providers/accounting/mappers/contractor.mapping.profile';
import { PaymentHistoryMappingProfile } from '../../../data/providers/accounting/mappers/payment-history.mapping.profile';
import { ICategoryModel } from '../../../domain/models/accounting/category.model';
import { IPaymentAccountModel } from '../../../domain/models/accounting/payment-account.model';
import { AccountNotification } from '../../../infrastructure/account-notification';
import { SseService } from '../../../infrastructure/sse-service';
import { PaymentsHistoryComponent } from '../../../presentation/accounting/components/payments-history/payments-history.component';
import { IPaymentRepresentationModel } from '../../../presentation/accounting/models/operation-record';
import { AccountsService } from '../../../presentation/accounting/services/accounts.service';
import { HandbooksService } from '../../../presentation/accounting/services/handbooks.service';
import { PaymentsHistoryService } from '../../../presentation/accounting/services/payments-history.service';

describe('payments history component', () => {
	let fixture: ComponentFixture<PaymentsHistoryComponent>;
	let component: PaymentsHistoryComponent;

	let contractorsProviderSpy: jasmine.SpyObj<DefaultContractorsProvider>;
	let categoriesProviderSpy: jasmine.SpyObj<DefaultCategoriesProvider>;
	let paymentsHistoryServiceSpy: jasmine.SpyObj<PaymentsHistoryService>;
	let accountsServiceSpy: jasmine.SpyObj<AccountsService>;
	let sseServiceSpy: jasmine.SpyObj<SseService>;
	let notificationsSubject: Subject<AccountNotification>;

	let store: Store;

	const activePaymentAccountId = '24a07833-5cf5-4885-b09d-32c089fac4dd';
	const incomeRecordId = Guid.parse('0879167a-a6e8-4518-9850-4dd87a4e5be6');
	const expenseRecordId = Guid.parse('fe19b48a-5510-481f-9cde-2fb29c9dd209');

	const historyRows: IPaymentRepresentationModel[] = [
		{
			key: incomeRecordId,
			operationDate: new Date(2024, 0, 15),
			contractor: 'test contractor',
			category: 'salary',
			income: 11,
			expense: 0,
			comment: 'income-comment',
			balance: 11,
			operationType: 0,
		},
		{
			key: expenseRecordId,
			operationDate: new Date(2099, 0, 1),
			contractor: 'future contractor',
			category: 'planned expense',
			income: 0,
			expense: 4.25,
			comment: 'expense-comment',
			balance: 6.75,
			operationType: 0,
		},
	];

	beforeEach(async () => {
		contractorsProviderSpy = jasmine.createSpyObj<DefaultContractorsProvider>('contractorsProvider', {
			getContractors: of([
				{
					key: Guid.parse('f67501cd-d235-4147-8bd6-963ff2665398'),
					nameNodes: ['test', 'contractor-1'],
				},
			]),
		});

		categoriesProviderSpy = jasmine.createSpyObj<DefaultCategoriesProvider>('categoriesProvider', {
			getCategoriries: of([
				{
					key: Guid.parse('01dd7121-b40b-4a52-ad50-46f989b8efb9'),
					nameNodes: ['test', 'category-1'],
				} as ICategoryModel,
			]),
		});

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
				PaymentsHistoryComponent,
				NgxsModule.forRoot(
					[
						AccountingOperationsState,
						AccountingOperationsTableState,
						HandbooksState,
						ContractorsState,
						CategoriesState,
						PaymentAccountState,
					],
					ngxsConfig
				),
				MapperModule.withProfiles([PaymentHistoryMappingProfile, DataContractorProfile, DataCategoryProfile]),
			],
			providers: [
				HandbooksService,
				{
					provide: DefaultContractorsProvider,
					useValue: contractorsProviderSpy,
				},
				{
					provide: DefaultCategoriesProvider,
					useValue: categoriesProviderSpy,
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
		store.dispatch(new SetActivePaymentAccount(activePaymentAccountId));
		store.dispatch(
			new SetInitialPaymentAccounts([
				{
					key: Guid.parse(activePaymentAccountId),
					description: 'payment-account under test',
				} as IPaymentAccountModel,
			])
		);

		fixture = TestBed.createComponent(PaymentsHistoryComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();

		await fixture.whenStable();
		fixture.detectChanges();
	});

	afterEach(() => {
		fixture.destroy();
		notificationsSubject.complete();
	});

	it('should create the standalone component and connect to accounting notifications', () => {
		expect(component).toBeTruthy();
		expect(sseServiceSpy.connect.calls.mostRecent().args).toEqual(['accounting/notifications/account-hub']);
	});

	it('should compile the real Material table template with expected columns', () => {
		expect(component.displayedColumns).toEqual([
			'operationDate',
			'contractor',
			'category',
			'income',
			'expense',
			'balance',
			'comment',
		]);
		expect(getHeaderTexts()).toEqual(['Date', 'Contractor', 'Category', 'Income', 'Expense', 'Balance', 'Comment']);
	});

	it('should render representative history rows and summary counts', () => {
		const tableText = getTableText();
		const componentText = getNativeElement().textContent ?? '';

		expect(getRenderedRows().length).toBe(2);
		expect(tableText).toContain('Jan 15, 2024');
		expect(tableText).toContain('test contractor');
		expect(tableText).toContain('salary');
		expect(tableText).toContain('11.00');
		expect(tableText).toContain('future contractor');
		expect(tableText).toContain('planned expense');
		expect(tableText).toContain('4.25');
		expect(tableText).toContain('expense-comment');
		expect(componentText).toContain('2');
		expect(component.futureRecordsCount).toBe(1);
	});

	it('should render no rows when history is empty', async () => {
		component.dataSource$.next([]);
		fixture.detectChanges();

		await fixture.whenStable();
		fixture.detectChanges();

		expect(component.recordsCount).toBe(0);
		expect(getRenderedRows().length).toBe(0);
	});

	it('should initialize selected row state from NGXS table options', () => {
		store.dispatch(new SetActiveAccountingOperation(incomeRecordId));
		fixture.detectChanges();

		expect(Array.from(component.clickedRowGuids).some(recordGuid => recordGuid.equals(incomeRecordId))).toBe(true);
	});

	it('should dispatch selected history operation when a row is clicked', async () => {
		getRenderedRows()[1].click();

		await fixture.whenStable();
		fixture.detectChanges();

		const tableOptions = store.selectSnapshot(getAccountingTableOptions);

		expect(tableOptions.selectedRecordGuid.toString()).toBe(expenseRecordId.toString());
		expect(Array.from(component.clickedRowGuids).some(recordGuid => recordGuid.equals(expenseRecordId))).toBe(true);
		expect(getRenderedRows()[1].classList).toContain('row-is-clicked');
	});

	it('should preserve repeated row selection behavior', async () => {
		const row = getRenderedRows()[1];

		row.click();
		row.click();

		await fixture.whenStable();
		fixture.detectChanges();

		const tableOptions = store.selectSnapshot(getAccountingTableOptions);

		expect(tableOptions.selectedRecordGuid.toString()).toBe(expenseRecordId.toString());
		expect(Array.from(component.clickedRowGuids).map(recordGuid => recordGuid.toString())).toEqual([
			expenseRecordId.toString(),
		]);
	});

	it('should refresh history and accounts after a matching SSE notification', () => {
		paymentsHistoryServiceSpy.refreshPaymentsHistory.calls.reset();
		accountsServiceSpy.refreshAccounts.calls.reset();

		notificationsSubject.next({
			eventId: 'event-id',
			accountId: activePaymentAccountId,
			eventType: 'UpdatePaymentAccountBalanceCommand',
		});

		expect(paymentsHistoryServiceSpy.refreshPaymentsHistory.calls.mostRecent().args).toEqual([
			activePaymentAccountId,
		]);
		expect(accountsServiceSpy.refreshAccounts.calls.mostRecent().args).toEqual([activePaymentAccountId]);
		expect(component.recordsCount).toBe(2);
	});

	function getHeaderTexts(): string[] {
		return Array.from<HTMLElement>(getNativeElement().querySelectorAll('th')).map(header =>
			(header.textContent ?? '').trim()
		);
	}

	function getTableText(): string {
		return getNativeElement().querySelector('mat-table, table')?.textContent ?? '';
	}

	function getRenderedRows(): HTMLElement[] {
		return Array.from<HTMLElement>(getNativeElement().querySelectorAll('mat-row, tr.mat-mdc-row, .mat-mdc-row'));
	}

	function getNativeElement(): HTMLElement {
		const nativeElement: unknown = fixture.nativeElement;

		if (!(nativeElement instanceof HTMLElement)) {
			throw new Error('Expected the component fixture to render an HTMLElement.');
		}

		return nativeElement;
	}
});
