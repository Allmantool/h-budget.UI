import { signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MapperModule } from '@dynamic-mapper/angular';
import { NgxsModule, Store } from '@ngxs/store';
import { of, Subject, throwError } from 'rxjs';
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
import { IPaymentHistoryQueryModel } from '../../../domain/models/accounting/payment-history-query.model';
import { AccountNotification } from '../../../infrastructure/account-notification';
import { SseService } from '../../../infrastructure/sse-service';
import { PaymentsHistoryComponent } from '../../../presentation/accounting/components/payments-history/payments-history.component';
import { IPaymentRepresentationModel } from '../../../presentation/accounting/models/operation-record';
import { AccountsService } from '../../../presentation/accounting/services/accounts.service';
import { HandbooksService } from '../../../presentation/accounting/services/handbooks.service';
import { PaymentEditorLeaveService } from '../../../presentation/accounting/services/payment-editor-leave.service';
import { PaymentEditorSessionService } from '../../../presentation/accounting/services/payment-editor-session.service';
import { PaymentsHistoryService } from '../../../presentation/accounting/services/payments-history.service';
import { RelatedTransferNavigationService } from '../../../presentation/accounting/services/related-transfer-navigation.service';
import { TransferProjectionSynchronizationService } from '../../../presentation/accounting/services/transfer-projection-synchronization.service';

describe('payments history component', () => {
	let fixture: ComponentFixture<PaymentsHistoryComponent>;
	let component: PaymentsHistoryComponent;

	let contractorsProviderSpy: jasmine.SpyObj<DefaultContractorsProvider>;
	let categoriesProviderSpy: jasmine.SpyObj<DefaultCategoriesProvider>;
	let paymentsHistoryServiceSpy: jasmine.SpyObj<PaymentsHistoryService>;
	let accountsServiceSpy: jasmine.SpyObj<AccountsService>;
	let relatedTransferNavigationServiceSpy: jasmine.SpyObj<RelatedTransferNavigationService>;
	let pendingRelatedOperationKeySignal: WritableSignal<Guid | undefined>;
	let sseServiceSpy: jasmine.SpyObj<SseService>;
	let notificationsSubject: Subject<AccountNotification>;
	let transferProjectionSynchronizationService: TransferProjectionSynchronizationService;
	let canLeaveEditor = true;

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
		canLeaveEditor = true;
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

		paymentsHistoryServiceSpy = jasmine.createSpyObj<PaymentsHistoryService>('paymentsHistoryService', [
			'refreshPaymentsHistory',
			'refreshPagedPaymentsHistory',
		]);
		paymentsHistoryServiceSpy.refreshPagedPaymentsHistory.and.callFake((_paymentAccountId, query) =>
			of(createPage(historyRows, query))
		);

		accountsServiceSpy = jasmine.createSpyObj<AccountsService>('accountsService', {
			refreshAccounts: of(undefined),
		});

		relatedTransferNavigationServiceSpy = jasmine.createSpyObj<RelatedTransferNavigationService>(
			'relatedTransferNavigationService',
			{
				completePendingTarget: undefined,
				getPendingTargetOperationKey: undefined,
				hasPendingTargetForAccount: false,
				navigateToRelatedTransfer: of(historyRows),
			}
		);
		pendingRelatedOperationKeySignal = signal<Guid | undefined>(undefined);
		relatedTransferNavigationServiceSpy.getPendingTargetOperationKey.and.callFake(() =>
			pendingRelatedOperationKeySignal()
		);
		relatedTransferNavigationServiceSpy.completePendingTarget.and.callFake(() =>
			pendingRelatedOperationKeySignal.set(undefined)
		);

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
				TransferProjectionSynchronizationService,
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
					provide: RelatedTransferNavigationService,
					useValue: relatedTransferNavigationServiceSpy,
				},
				{
					provide: SseService,
					useValue: sseServiceSpy,
				},
				{ provide: PaymentEditorLeaveService, useValue: { canLeave: () => Promise.resolve(canLeaveEditor) } },
				PaymentEditorSessionService,
			],
		}).compileComponents();

		store = TestBed.inject(Store);
		transferProjectionSynchronizationService = TestBed.inject(TransferProjectionSynchronizationService);
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
			'actions',
		]);
		expect(getHeaderTexts()).toEqual([
			'Date  ↓',
			'Contractor',
			'Category',
			'Income',
			'Expense',
			'Balance',
			'Comment',
			'Actions',
		]);
	});

	it('renders an always-available Add payment action above the history table', () => {
		expect(getNativeElement().textContent).toContain('Add payment');
	});

	it('uses Material filter and pagination controls while keeping query application explicit', () => {
		const nativeElement = getNativeElement();

		expect(nativeElement.querySelectorAll('mat-form-field').length).toBeGreaterThan(0);
		expect(nativeElement.querySelectorAll('mat-select').length).toBeGreaterThan(0);
		expect(nativeElement.querySelector('mat-paginator')).not.toBeNull();
		expect(nativeElement.textContent).toContain('Apply filters');
		expect(nativeElement.textContent).toContain('Showing 2 of 2 results');
	});

	it('provides a labelled row edit action in addition to row selection', async () => {
		const editButton = getNativeElement().querySelector<HTMLButtonElement>('button[aria-label="Edit payment"]');

		expect(editButton).not.toBeNull();
		editButton?.click();
		await fixture.whenStable();

		expect(store.selectSnapshot(getAccountingTableOptions).selectedRecordGuid.toString()).toBe(
			incomeRecordId.toString()
		);
	});

	it('does not load until valid draft filters are applied', () => {
		paymentsHistoryServiceSpy.refreshPagedPaymentsHistory.calls.reset();

		component.updateDraftFilter('type', 'expense');
		expect(paymentsHistoryServiceSpy.refreshPagedPaymentsHistory.calls.count()).toBe(0);

		component.applyFilters();

		expect(paymentsHistoryServiceSpy.refreshPagedPaymentsHistory.calls.count()).toBe(1);
		expect(pageRequest()).toEqual(jasmine.objectContaining({ page: 1, type: 'expense' }));
	});

	it('keeps an invalid amount range local instead of issuing an invalid history request', () => {
		paymentsHistoryServiceSpy.refreshPagedPaymentsHistory.calls.reset();
		component.updateDraftFilter('amountMin', '20');
		component.updateDraftFilter('amountMax', '10');

		component.applyFilters();
		fixture.detectChanges();

		expect(paymentsHistoryServiceSpy.refreshPagedPaymentsHistory.calls.count()).toBe(0);
		expect(getNativeElement().textContent).toContain('minimum amount must not exceed the maximum amount');
	});

	it('loads the initial page once for the selected account without a notification', () => {
		expect(paymentsHistoryServiceSpy.refreshPagedPaymentsHistory.calls.count()).toBe(1);
		expect(paymentsHistoryServiceSpy.refreshPagedPaymentsHistory.calls.mostRecent().args).toEqual([
			activePaymentAccountId,
			jasmine.objectContaining({ page: 1, pageSize: 25, sortBy: 'date', sortDirection: 'desc' }),
		]);
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

	it('renders loading, empty, and read-error states without confusing an error for an empty history', () => {
		component.dataSource$.next([]);
		component.historyLoadingSignal.set(true);
		component.historyLoadErrorSignal.set(false);
		fixture.detectChanges();
		expect(getNativeElement().textContent).toContain('Loading transactions…');
		expect(getNativeElement().textContent).not.toContain('No transactions yet.');

		component.historyLoadingSignal.set(false);
		fixture.detectChanges();
		expect(getNativeElement().textContent).toContain('No transactions yet.');
		expect(getNativeElement().textContent).toContain('Add payment');

		component.historyLoadErrorSignal.set(true);
		fixture.detectChanges();
		expect(getNativeElement().textContent).toContain('Payments could not be loaded.');
		expect(getNativeElement().textContent).toContain('Retry');
	});

	it('keeps loaded transactions visible and offers Retry after a refresh error', () => {
		component.historyLoadErrorSignal.set(true);
		component.historyLoadingSignal.set(false);
		fixture.detectChanges();

		expect(getRenderedRows().length).toBe(2);
		expect(getNativeElement().textContent).toContain('Showing the most recently loaded history.');
		expect(getNativeElement().textContent).toContain('Retry');
	});

	it('retries a failed history read through the existing projection refresh action', async () => {
		paymentsHistoryServiceSpy.refreshPagedPaymentsHistory.calls.reset();
		accountsServiceSpy.refreshAccounts.calls.reset();
		paymentsHistoryServiceSpy.refreshPagedPaymentsHistory.and.returnValue(
			throwError(() => new Error('History read failed.'))
		);

		component.retryHistory();
		await fixture.whenStable();
		fixture.detectChanges();

		expect(paymentsHistoryServiceSpy.refreshPagedPaymentsHistory.calls.count()).toBe(1);
		expect(component.historyLoadErrorSignal()).toBeTrue();

		paymentsHistoryServiceSpy.refreshPagedPaymentsHistory.and.callFake((_paymentAccountId, query) =>
			of(createPage(historyRows, query))
		);
		component.retryHistory();
		await fixture.whenStable();
		fixture.detectChanges();

		expect(paymentsHistoryServiceSpy.refreshPagedPaymentsHistory.calls.count()).toBe(2);
		expect(pageRequest()).toEqual(
			jasmine.objectContaining({ page: 1, pageSize: 25, sortBy: 'date', sortDirection: 'desc' })
		);
		expect(accountsServiceSpy.refreshAccounts.calls.count()).toBe(2);
		expect(accountsServiceSpy.refreshAccounts.calls.mostRecent().args).toEqual([activePaymentAccountId]);
		expect(component.historyLoadErrorSignal()).toBeFalse();
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
		expect(getRenderedRows()[1].classList).toContain('payments-history__row--selected');
		expect(getRenderedRows()[1].getAttribute('aria-selected')).toBe('true');
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

	it('returns the editor to create mode and clears selection when Add payment is used from an edit', async () => {
		const editorSession = TestBed.inject(PaymentEditorSessionService);
		store.dispatch(new SetActiveAccountingOperation(incomeRecordId));
		editorSession.beginEdit();
		fixture.detectChanges();

		const addPaymentButton = Array.from(getNativeElement().querySelectorAll<HTMLButtonElement>('button')).find(
			button => button.textContent?.includes('Add payment')
		);
		addPaymentButton?.click();
		await fixture.whenStable();
		fixture.detectChanges();

		expect(editorSession.editorModeSignal()).toBe('create');
		expect(store.selectSnapshot(getAccountingTableOptions).selectedRecordGuid).toBeUndefined();
	});

	it('keeps a changed editor intact when the shared leave guard rejects Add payment', async () => {
		const editorSession = TestBed.inject(PaymentEditorSessionService);
		store.dispatch(new SetActiveAccountingOperation(incomeRecordId));
		editorSession.beginEdit();
		canLeaveEditor = false;

		await component.addPayment();

		expect(editorSession.editorModeSignal()).toBe('edit');
		expect(store.selectSnapshot(getAccountingTableOptions).selectedRecordGuid.toString()).toBe(
			incomeRecordId.toString()
		);
	});

	it('keeps selected and recently updated row semantics together', () => {
		const editorSession = TestBed.inject(PaymentEditorSessionService);
		store.dispatch(new SetActiveAccountingOperation(incomeRecordId));
		editorSession.queueRecentMutation(incomeRecordId, 'updated');
		editorSession.confirmRecentMutationIsVisible([incomeRecordId]);
		fixture.detectChanges();

		const selectedRow = getRenderedRows()[0];
		expect(selectedRow.classList).toContain('payments-history__row--selected');
		expect(selectedRow.classList).toContain('payments-history__row--recent-updated');
		expect(selectedRow.textContent).toContain('Updated');
	});

	it('uses one roving keyboard tab stop for history row activation', () => {
		const rows = getRenderedRows();

		expect(rows[0].getAttribute('tabindex')).toBe('0');
		expect(rows[1].getAttribute('tabindex')).toBe('-1');
	});

	it('refreshes the current paged query and account summary', () => {
		paymentsHistoryServiceSpy.refreshPagedPaymentsHistory.calls.reset();
		accountsServiceSpy.refreshAccounts.calls.reset();

		component.retryHistory();

		expect(paymentsHistoryServiceSpy.refreshPagedPaymentsHistory.calls.count()).toBe(1);
		expect(pageRequest()).toEqual(jasmine.objectContaining({ page: 1, pageSize: 25 }));
		expect(accountsServiceSpy.refreshAccounts.calls.mostRecent().args).toEqual([activePaymentAccountId]);
		expect(component.recordsCount).toBe(2);
	});

	it('uses the current query for every explicit refresh without locally mutating rows', () => {
		const firstHistoryResponse = new Subject<ReturnType<typeof createPage>>();
		const secondHistoryResponse = new Subject<ReturnType<typeof createPage>>();
		const latestRows = [historyRows[1]];
		paymentsHistoryServiceSpy.refreshPagedPaymentsHistory.calls.reset();
		accountsServiceSpy.refreshAccounts.calls.reset();
		paymentsHistoryServiceSpy.refreshPagedPaymentsHistory.and.returnValues(
			firstHistoryResponse,
			secondHistoryResponse
		);
		accountsServiceSpy.refreshAccounts.and.returnValues(of(undefined), of(undefined));

		component.retryHistory();

		expect(paymentsHistoryServiceSpy.refreshPagedPaymentsHistory.calls.count()).toBe(1);
		firstHistoryResponse.next(createPage(historyRows, component.paymentHistoryQuerySignal()));
		firstHistoryResponse.complete();

		component.retryHistory();
		expect(paymentsHistoryServiceSpy.refreshPagedPaymentsHistory.calls.count()).toBe(2);
		secondHistoryResponse.next(createPage(latestRows, component.paymentHistoryQuerySignal()));
		secondHistoryResponse.complete();

		expect(component.historySummarySignal()).toEqual(latestRows);
	});

	it('queues one final account refresh when a notification arrives during an active refresh', () => {
		const firstHistoryResponse = new Subject<ReturnType<typeof createPage>>();
		const secondHistoryResponse = new Subject<ReturnType<typeof createPage>>();
		paymentsHistoryServiceSpy.refreshPagedPaymentsHistory.calls.reset();
		paymentsHistoryServiceSpy.refreshPagedPaymentsHistory.and.returnValues(
			firstHistoryResponse,
			secondHistoryResponse
		);
		accountsServiceSpy.refreshAccounts.and.returnValues(of(undefined), of(undefined));

		component.retryHistory();
		notificationsSubject.next({
			eventId: Guid.create().toString(),
			accountId: activePaymentAccountId,
			eventType: 'UpdatePaymentAccountBalanceCommand',
		});

		expect(paymentsHistoryServiceSpy.refreshPagedPaymentsHistory.calls.count()).toBe(1);
		firstHistoryResponse.next(createPage(historyRows, component.paymentHistoryQuerySignal()));
		firstHistoryResponse.complete();

		expect(paymentsHistoryServiceSpy.refreshPagedPaymentsHistory.calls.count()).toBe(2);
		secondHistoryResponse.next(createPage(historyRows, component.paymentHistoryQuerySignal()));
		secondHistoryResponse.complete();
	});

	it('does not issue a refresh after the component is destroyed', () => {
		const firstHistoryResponse = new Subject<ReturnType<typeof createPage>>();
		paymentsHistoryServiceSpy.refreshPagedPaymentsHistory.calls.reset();
		paymentsHistoryServiceSpy.refreshPagedPaymentsHistory.and.returnValue(firstHistoryResponse);

		component.retryHistory();
		expect(paymentsHistoryServiceSpy.refreshPagedPaymentsHistory.calls.count()).toBe(1);

		fixture.destroy();
		component.retryHistory();

		expect(paymentsHistoryServiceSpy.refreshPagedPaymentsHistory.calls.count()).toBe(1);
	});
	it('completes synchronization only after the submitted transfer is present in refreshed history', () => {
		transferProjectionSynchronizationService.start([Guid.parse(activePaymentAccountId)], incomeRecordId);

		component.retryHistory();

		expect(transferProjectionSynchronizationService.isSynchronizing(activePaymentAccountId)).toBeFalse();
	});

	it('does not complete synchronization when a refresh excludes the submitted transfer', () => {
		transferProjectionSynchronizationService.start([Guid.parse(activePaymentAccountId)], Guid.create());

		component.retryHistory();

		expect(transferProjectionSynchronizationService.isSynchronizing(activePaymentAccountId)).toBeTrue();
	});

	it('does not access rendered rows when no related operation navigation is pending', async () => {
		const scrollIntoViewSpy = spyOn(HTMLElement.prototype, 'scrollIntoView');

		fixture.detectChanges();
		await fixture.whenStable();

		expect(scrollIntoViewSpy).not.toHaveBeenCalled();
		expect(relatedTransferNavigationServiceSpy.completePendingTarget.calls.count()).toBe(0);
	});

	it('waits for a target row, then focuses it once and consumes the pending navigation', async () => {
		const scrollIntoViewSpy = spyOn(HTMLElement.prototype, 'scrollIntoView');
		const focusSpy = spyOn(HTMLElement.prototype, 'focus');

		component.dataSource$.next([]);
		fixture.detectChanges();
		await fixture.whenStable();

		pendingRelatedOperationKeySignal.set(incomeRecordId);
		fixture.detectChanges();
		await fixture.whenStable();

		expect(scrollIntoViewSpy).not.toHaveBeenCalled();
		expect(relatedTransferNavigationServiceSpy.completePendingTarget.calls.count()).toBe(0);

		component.dataSource$.next([historyRows[0]]);
		fixture.detectChanges();
		await fixture.whenStable();
		fixture.detectChanges();

		expect(scrollIntoViewSpy).toHaveBeenCalledTimes(1);
		expect(focusSpy).toHaveBeenCalledTimes(1);
		expect(relatedTransferNavigationServiceSpy.completePendingTarget.calls.mostRecent().args).toEqual([
			activePaymentAccountId,
			incomeRecordId,
		]);
		expect(getRenderedRows()[0].classList).toContain('payments-history__row--related-target');

		fixture.detectChanges();

		expect(scrollIntoViewSpy).toHaveBeenCalledTimes(1);
		expect(focusSpy).toHaveBeenCalledTimes(1);
	});

	it('skips a malformed row identity and resolves the matching valid rendered row', async () => {
		const scrollIntoViewSpy = spyOn(HTMLElement.prototype, 'scrollIntoView');
		component.dataSource$.next(historyRows);
		fixture.detectChanges();
		await fixture.whenStable();

		getRenderedRows()[0].removeAttribute('data-operation-key');
		pendingRelatedOperationKeySignal.set(expenseRecordId);
		component.dataSource$.next([...historyRows]);
		fixture.detectChanges();
		await fixture.whenStable();
		fixture.detectChanges();

		expect(scrollIntoViewSpy).toHaveBeenCalledTimes(1);
		expect(relatedTransferNavigationServiceSpy.completePendingTarget.calls.mostRecent().args).toEqual([
			activePaymentAccountId,
			expenseRecordId,
		]);
	});

	it('renders an accessible related-transfer action without replacing the transfer comment', async () => {
		const relatedPaymentAccountId = Guid.parse('8f9f90a8-048f-44a9-b634-b02226724438');
		const transferRecord: IPaymentRepresentationModel = {
			key: Guid.parse('db983a99-a222-4083-afcb-af98fac0e846'),
			operationDate: new Date(2024, 0, 16),
			contractor: '',
			category: '',
			income: 0,
			expense: 13,
			comment: 'Transfer to BelarusBank',
			balance: -2,
			operationType: 2,
			relatedPaymentAccountId,
			relatedPaymentAccountName: 'BelarusBank',
		};

		component.dataSource$.next([transferRecord]);
		fixture.detectChanges();

		await fixture.whenStable();
		fixture.detectChanges();

		const relatedTransferButton = getNativeElement().querySelector<HTMLButtonElement>(
			'.payments-history__related-transfer-link'
		);

		expect(relatedTransferButton?.type).toBe('button');
		expect(relatedTransferButton?.getAttribute('aria-label')).toBe('Open related transfer in BelarusBank');
		expect(getTableText()).toContain('Transfer to BelarusBank');

		relatedTransferButton?.click();
		await fixture.whenStable();
		fixture.detectChanges();

		expect(relatedTransferNavigationServiceSpy.navigateToRelatedTransfer.calls.count()).toBe(1);
		expect(relatedTransferNavigationServiceSpy.navigateToRelatedTransfer.calls.mostRecent().args).toEqual([
			transferRecord,
		]);
	});

	it('renders the authoritative cross-currency conversion with its canonical direction', async () => {
		const relatedPaymentAccountId = Guid.parse('8f9f90a8-048f-44a9-b634-b02226724438');
		const transferRecord: IPaymentRepresentationModel = {
			key: Guid.parse('db983a99-a222-4083-afcb-af98fac0e846'),
			operationDate: new Date(2024, 0, 16),
			contractor: '',
			category: '',
			income: 0,
			expense: 13,
			comment: 'Transfer to BelarusBank',
			balance: -2,
			operationType: 2,
			relatedPaymentAccountId,
			conversionMultiplier: 3.1,
		};

		store.dispatch(
			new SetInitialPaymentAccounts([
				{
					key: Guid.parse(activePaymentAccountId),
					description: 'source account',
					currency: 'USD',
				} as IPaymentAccountModel,
				{
					key: relatedPaymentAccountId,
					description: 'BelarusBank',
					currency: 'BYN',
				} as IPaymentAccountModel,
			])
		);
		paymentsHistoryServiceSpy.refreshPagedPaymentsHistory.and.callFake((_accountId, query) =>
			of(createPage([transferRecord], query))
		);
		component.retryHistory();
		fixture.detectChanges();

		await fixture.whenStable();
		fixture.detectChanges();

		expect(getTableText()).toContain('Conversion: 1 USD = 3.1 BYN');
	});

	it('keeps the historical conversion direction canonical for the recipient transfer row', async () => {
		const sourcePaymentAccountId = Guid.parse('8f9f90a8-048f-44a9-b634-b02226724438');
		const recipientAccountId = Guid.parse(activePaymentAccountId);
		const transferRecord: IPaymentRepresentationModel = {
			key: Guid.parse('db983a99-a222-4083-afcb-af98fac0e846'),
			operationDate: new Date(2024, 0, 16),
			contractor: '',
			category: '',
			income: 13,
			expense: 0,
			comment: 'Transfer from source account',
			balance: 13,
			operationType: 2,
			relatedPaymentAccountId: sourcePaymentAccountId,
			conversionMultiplier: 3.1,
		};

		store.dispatch(
			new SetInitialPaymentAccounts([
				{
					key: recipientAccountId,
					description: 'recipient account',
					currency: 'BYN',
				} as IPaymentAccountModel,
				{
					key: sourcePaymentAccountId,
					description: 'source account',
					currency: 'USD',
				} as IPaymentAccountModel,
			])
		);
		paymentsHistoryServiceSpy.refreshPagedPaymentsHistory.and.callFake((_accountId, query) =>
			of(createPage([transferRecord], query))
		);
		notificationsSubject.next({
			eventId: 'event-id',
			accountId: activePaymentAccountId,
			eventType: 'UpdatePaymentAccountBalanceCommand',
		});
		fixture.detectChanges();

		await fixture.whenStable();
		fixture.detectChanges();

		expect(getTableText()).toContain('Conversion: 1 USD = 3.1 BYN');
	});

	it('does not render conversion metadata for same-currency transfers', async () => {
		const transferRecord: IPaymentRepresentationModel = {
			key: Guid.parse('db983a99-a222-4083-afcb-af98fac0e846'),
			operationDate: new Date(2024, 0, 16),
			contractor: '',
			category: '',
			income: 0,
			expense: 13,
			comment: 'Transfer to BelarusBank',
			balance: -2,
			operationType: 2,
			relatedPaymentAccountId: Guid.parse('8f9f90a8-048f-44a9-b634-b02226724438'),
			relatedPaymentAccountName: 'BelarusBank',
			conversionMultiplier: 1,
		};

		component.dataSource$.next([transferRecord]);
		fixture.detectChanges();

		await fixture.whenStable();
		fixture.detectChanges();

		expect(getTableText()).not.toContain('Conversion:');
	});

	function getHeaderTexts(): string[] {
		return Array.from<HTMLElement>(getNativeElement().querySelectorAll('th')).map(header =>
			(header.textContent ?? '').trim()
		);
	}

	function createPage(
		items: IPaymentRepresentationModel[],
		query: IPaymentHistoryQueryModel,
		override: Partial<{
			page: number;
			pageSize: number;
			totalCount: number;
			totalPages: number;
			hasPreviousPage: boolean;
			hasNextPage: boolean;
		}> = {}
	) {
		const totalCount = override.totalCount ?? items.length;
		const totalPages = override.totalPages ?? (totalCount === 0 ? 0 : Math.ceil(totalCount / query.pageSize));
		return {
			items,
			page: override.page ?? query.page,
			pageSize: override.pageSize ?? query.pageSize,
			totalCount,
			totalPages,
			hasPreviousPage: override.hasPreviousPage ?? query.page > 1,
			hasNextPage: override.hasNextPage ?? query.page < totalPages,
		};
	}

	function pageRequest(): IPaymentHistoryQueryModel {
		return paymentsHistoryServiceSpy.refreshPagedPaymentsHistory.calls.mostRecent().args[1];
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
