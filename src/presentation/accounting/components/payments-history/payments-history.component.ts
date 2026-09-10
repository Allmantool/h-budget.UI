import { AsyncPipe, CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import {
	afterEveryRender,
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	DestroyRef,
	ElementRef,
	inject,
	OnDestroy,
	OnInit,
	Signal,
	signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { SseService } from 'infrastructure/sse-service';

import { Select, Store } from '@ngxs/store';
import { isFuture } from 'date-fns';
import {
	BehaviorSubject,
	catchError,
	distinctUntilChanged,
	EMPTY,
	filter,
	forkJoin,
	map,
	merge,
	Observable,
	shareReplay,
	Subject,
	switchMap,
	tap,
} from 'rxjs';
import { exhaustMap } from 'rxjs/operators';
import { Guid } from 'typescript-guid';

import { AccountingCurrencyFormatPipe } from '../../../../app/modules/shared/pipes/accounting-currency.pipe';
import { IAccountingOperationsTableOptions } from '../../../../app/modules/shared/store/models/accounting/accounting-table-options';
import { SetActiveAccountingOperation } from '../../../../app/modules/shared/store/states/accounting/actions/accounting-table-options.actions';
import { getCategories } from '../../../../app/modules/shared/store/states/handbooks/selectors/categories.selectors';
import { getContractors } from '../../../../app/modules/shared/store/states/handbooks/selectors/counterparties.selectors';
import {
	getActivePaymentAccountId,
	getPaymentAccounts,
} from '../../../../app/modules/shared/store/states/accounting/selectors/payment-account.selector';
import { getAccountingTableOptions } from '../../../../app/modules/shared/store/states/accounting/selectors/table-options.selectors';
import { IPaymentAccountModel } from '../../../../domain/models/accounting/payment-account.model';
import { ICategoryModel } from '../../../../domain/models/accounting/category.model';
import { IContractorModel } from '../../../../domain/models/accounting/contractor.model.';
import {
	defaultPaymentHistoryQuery,
	IPaymentHistoryQueryModel,
} from '../../../../domain/models/accounting/payment-history-query.model';
import { IPaymentRepresentationModel } from '../../models/operation-record';
import { AccountsService } from '../../services/accounts.service';
import { HandbooksService } from '../../services/handbooks.service';
import { PaymentsHistoryService } from '../../services/payments-history.service';
import { RelatedTransferNavigationService } from '../../services/related-transfer-navigation.service';
import { TransferProjectionSynchronizationService } from '../../services/transfer-projection-synchronization.service';
import { PaymentEditorLeaveService } from '../../services/payment-editor-leave.service';
import { PaymentEditorSessionService, RecentPaymentMutation } from '../../services/payment-editor-session.service';

@Component({
	selector: 'payments-history',
	templateUrl: './payments-history.component.html',
	styleUrls: ['./payments-history.component.css'],
	changeDetection: ChangeDetectionStrategy.OnPush,
	standalone: true,
	imports: [
		AsyncPipe,
		CurrencyPipe,
		DatePipe,
		DecimalPipe,
		MatButtonModule,
		MatIconModule,
		MatTableModule,
		AccountingCurrencyFormatPipe,
	],
})
export class PaymentsHistoryComponent implements OnInit, OnDestroy, AfterViewInit {
	private readonly destroyRef = inject(DestroyRef);
	private readonly hostElement = inject<ElementRef<HTMLElement>>(ElementRef);
	private readonly relatedTransferNavigationRequests$ = new Subject<IPaymentRepresentationModel>();
	private readonly timelineRefreshRequests$ = new Subject<void>();
	private relatedOperationHighlightTimeout?: ReturnType<typeof setTimeout>;
	private highlightedRelatedOperationElement?: HTMLElement;
	private readonly handbooksReady$: Observable<void>;
	private isProjectionRefreshActive = false;
	private hasQueuedProjectionRefresh = false;
	private isDestroyed = false;

	@Select(getCategories)
	public categories$!: Observable<ICategoryModel[]>;

	@Select(getContractors)
	public contractors$!: Observable<IContractorModel[]>;

	@Select(getActivePaymentAccountId)
	public getActivePaymentAccountId$!: Observable<string>;

	@Select(getPaymentAccounts)
	public paymentAccounts$!: Observable<IPaymentAccountModel[]>;

	@Select(getAccountingTableOptions)
	public accountingTableOptions$!: Observable<IAccountingOperationsTableOptions>;

	public activePaymentAccountIdSignal: Signal<string> = toSignal(this.getActivePaymentAccountId$, {
		initialValue: Guid.EMPTY.toString(),
	});

	public displayedColumns: string[] = [
		'operationDate',
		'contractor',
		'category',
		'income',
		'expense',
		'balance',
		'comment',
	];

	public dataSource$: BehaviorSubject<IPaymentRepresentationModel[]> = new BehaviorSubject<
		IPaymentRepresentationModel[]
	>([]);

	public clickedRowGuids = new Set<Guid>();
	public highlightedRelatedOperationKey?: Guid;
	public readonly historyLoadingSignal = signal(true);
	public readonly historyLoadErrorSignal = signal(false);
	public readonly paymentHistoryQuerySignal = signal<IPaymentHistoryQueryModel>(defaultPaymentHistoryQuery);
	public readonly totalCountSignal = signal(0);
	public readonly totalPagesSignal = signal(0);
	public readonly hasPreviousPageSignal = signal(false);
	public readonly hasNextPageSignal = signal(false);
	public readonly math = Math;
	public readonly recentMutation = () => this.paymentEditorSession.recentMutationSignal();

	constructor(
		private readonly handbooksService: HandbooksService,
		private readonly paymentsHistoryService: PaymentsHistoryService,
		private readonly accountsService: AccountsService,
		private readonly store: Store,
		private readonly sseService: SseService,
		private readonly transferProjectionSynchronizationService: TransferProjectionSynchronizationService,
		public readonly relatedTransferNavigationService: RelatedTransferNavigationService,
		private readonly changeDetectorRef: ChangeDetectorRef,
		private readonly paymentEditorLeaveService: PaymentEditorLeaveService,
		private readonly paymentEditorSession: PaymentEditorSessionService
	) {
		this.handbooksReady$ = this.handbooksService
			.setupHandbooksStore()
			.pipe(shareReplay({ bufferSize: 1, refCount: false }));

		afterEveryRender({
			read: () => this.resolvePendingRelatedOperation(),
		});
	}

	public ngOnInit(): void {
		this.handbooksReady$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe();

		this.accountingTableOptions$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(options => {
			this.clickedRowGuids.clear();
			this.clickedRowGuids.add(options?.selectedRecordGuid);
		});

		this.sseService.connect('accounting/notifications/account-hub');

		this.sseService.notifications$
			.pipe(
				takeUntilDestroyed(this.destroyRef),
				filter(
					notification =>
						notification.eventType === 'UpdatePaymentAccountBalanceCommand' &&
						notification.accountId === this.activePaymentAccountIdSignal().toString()
				)
			)
			.subscribe(() => this.requestProjectionRefresh());

		this.relatedTransferNavigationRequests$
			.pipe(
				takeUntilDestroyed(this.destroyRef),
				exhaustMap(record => this.relatedTransferNavigationService.navigateToRelatedTransfer(record))
			)
			.subscribe(payments => this.publishPayments(payments));
	}

	public ngAfterViewInit(): void {
		merge(
			this.getActivePaymentAccountId$.pipe(
				filter(accountId => accountId.toString() !== Guid.EMPTY.toString()),
				distinctUntilChanged(),
				tap(() => this.resetQueryForAccountChange()),
				map(() => undefined)
			),
			this.timelineRefreshRequests$
		)
			.pipe(
				takeUntilDestroyed(this.destroyRef),
				switchMap(() =>
					this.handbooksReady$.pipe(
						switchMap(() => this.refreshActiveAccountProjection()),
						catchError(() => {
							this.showHistoryLoadError();
							return EMPTY;
						})
					)
				)
			)
			.subscribe(payments => this.publishPayments(payments));
	}

	ngOnDestroy() {
		this.isDestroyed = true;
		this.hasQueuedProjectionRefresh = false;
		this.sseService.disconnect();
		this.relatedTransferNavigationRequests$.complete();

		if (this.relatedOperationHighlightTimeout) {
			globalThis.clearTimeout(this.relatedOperationHighlightTimeout);
		}
	}

	public async selectRow(record: IPaymentRepresentationModel): Promise<void> {
		if (!(await this.paymentEditorLeaveService.canLeave())) {
			return;
		}

		this.paymentEditorSession.beginEdit();
		this.store.dispatch(new SetActiveAccountingOperation(record.key));
	}

	public async addPayment(): Promise<void> {
		if (!(await this.paymentEditorLeaveService.canLeave())) {
			return;
		}

		this.paymentEditorSession.beginCreate();
		this.store.dispatch(new SetActiveAccountingOperation(undefined));
	}

	public retryHistory(): void {
		this.requestProjectionRefresh();
	}

	public changePage(page: number): void {
		if (page < 1 || page > this.totalPagesSignal() || page === this.paymentHistoryQuerySignal().page) {
			return;
		}

		this.updateQuery({ page });
	}

	public changePageSize(event: Event): void {
		const target = event.target;
		if (!(target instanceof HTMLSelectElement)) {
			return;
		}

		this.updateQuery({ page: 1, pageSize: Number(target.value) as IPaymentHistoryQueryModel['pageSize'] });
	}

	public toggleSort(sortBy: IPaymentHistoryQueryModel['sortBy']): void {
		const current = this.paymentHistoryQuerySignal();
		this.updateQuery({
			page: current.sortBy === sortBy ? current.page : 1,
			sortBy,
			sortDirection: current.sortBy === sortBy && current.sortDirection === 'desc' ? 'asc' : 'desc',
		});
	}

	public updateFilter(
		event: Event,
		field: keyof Pick<
			IPaymentHistoryQueryModel,
			'dateFrom' | 'dateTo' | 'type' | 'categoryId' | 'contractorId' | 'amountMin' | 'amountMax'
		>
	): void {
		const target = event.target;
		if (!(target instanceof HTMLInputElement || target instanceof HTMLSelectElement)) {
			return;
		}

		const value = target.value;
		const parsedValue =
			field === 'amountMin' || field === 'amountMax'
				? value === ''
					? undefined
					: Number(value)
				: value === ''
					? undefined
					: value;
		this.updateQuery({ page: 1, [field]: parsedValue });
	}

	public clearFilters(): void {
		const { pageSize, sortBy, sortDirection } = this.paymentHistoryQuerySignal();
		this.paymentHistoryQuerySignal.set({ page: 1, pageSize, sortBy, sortDirection });
		this.requestProjectionRefresh();
	}
	public isFuturePayment = (record: IPaymentRepresentationModel): boolean => isFuture(record.operationDate);

	public isSelected(record: IPaymentRepresentationModel): boolean {
		return this.clickedRowGuids.has(record.key);
	}

	public isRowTabStop(record: IPaymentRepresentationModel): boolean {
		return this.isSelected(record) || this.historySummarySignal()[0]?.key.equals(record.key) === true;
	}

	public recentMutationFor(record: IPaymentRepresentationModel): RecentPaymentMutation | undefined {
		const recentMutation = this.paymentEditorSession.recentMutationSignal();
		return recentMutation?.operationId.equals(record.key) ? recentMutation : undefined;
	}

	public async navigateToRelatedTransfer(record: IPaymentRepresentationModel): Promise<void> {
		if (!(await this.paymentEditorLeaveService.canLeave())) {
			return;
		}

		this.clearRelatedOperationHighlight();
		this.relatedTransferNavigationRequests$.next(record);
	}

	public readonly historySummarySignal = toSignal(this.dataSource$.pipe(), {
		initialValue: [],
	});

	public get recordsCount(): number {
		return this.historySummarySignal().length;
	}

	public get futureRecordsCount(): number {
		return this.historySummarySignal().filter(record => this.isFuturePayment(record)).length;
	}

	private refreshActiveAccountProjection(): Observable<IPaymentRepresentationModel[]> {
		const accountId = this.activePaymentAccountIdSignal();

		return forkJoin({
			payments: this.paymentsHistoryService.refreshPagedPaymentsHistory(
				accountId,
				this.paymentHistoryQuerySignal()
			),
			balance: this.accountsService.refreshAccounts(accountId),
		}).pipe(
			map(payload => {
				this.setPageMetadata(payload.payments);
				return payload.payments.items;
			})
		);
	}

	private resetQueryForAccountChange(): void {
		this.paymentHistoryQuerySignal.set({
			...defaultPaymentHistoryQuery,
			pageSize: this.paymentHistoryQuerySignal().pageSize,
		});
	}

	private updateQuery(update: Partial<IPaymentHistoryQueryModel>): void {
		this.paymentHistoryQuerySignal.set({ ...this.paymentHistoryQuerySignal(), ...update });
		this.requestProjectionRefresh();
	}

	private setPageMetadata(page: {
		page: number;
		totalCount: number;
		totalPages: number;
		hasPreviousPage: boolean;
		hasNextPage: boolean;
	}): void {
		this.totalCountSignal.set(page.totalCount);
		this.totalPagesSignal.set(page.totalPages);
		this.hasPreviousPageSignal.set(page.hasPreviousPage);
		this.hasNextPageSignal.set(page.hasNextPage);
	}

	private requestProjectionRefresh(): void {
		if (this.isDestroyed) {
			return;
		}

		this.historyLoadingSignal.set(true);
		this.historyLoadErrorSignal.set(false);
		this.timelineRefreshRequests$.next();
	}

	private completeProjectionRefresh(): void {
		this.isProjectionRefreshActive = false;
		if (this.isDestroyed) {
			return;
		}

		if (this.hasQueuedProjectionRefresh) {
			this.hasQueuedProjectionRefresh = false;
			this.requestProjectionRefresh();
		}
	}

	private publishPayments(records: IPaymentRepresentationModel[]): void {
		const displayRecords = this.withRelatedPaymentAccountNames(records);
		const activePaymentAccountId = this.activePaymentAccountIdSignal();

		this.dataSource$.next(displayRecords);
		this.historyLoadingSignal.set(false);
		this.historyLoadErrorSignal.set(false);
		this.paymentEditorSession.confirmRecentMutationIsVisible(displayRecords.map(record => record.key));
		this.transferProjectionSynchronizationService.completeProjectedOperations(
			activePaymentAccountId,
			displayRecords.map(record => record.key)
		);
	}

	private showHistoryLoadError(): void {
		this.historyLoadingSignal.set(false);
		this.historyLoadErrorSignal.set(true);
	}

	private withRelatedPaymentAccountNames(records: IPaymentRepresentationModel[]): IPaymentRepresentationModel[] {
		const paymentAccounts = this.store.selectSnapshot(getPaymentAccounts);
		const activePaymentAccount = paymentAccounts.find(
			account => account.key?.toString() === this.activePaymentAccountIdSignal()
		);

		return records.map(record => {
			const relatedPaymentAccountId = record.relatedPaymentAccountId;

			if (!relatedPaymentAccountId) {
				return record;
			}

			const relatedAccount = paymentAccounts.find(
				account => account.key?.equals(relatedPaymentAccountId) === true
			);
			const relatedPaymentAccountName = [relatedAccount?.emitter, relatedAccount?.description]
				.filter((name): name is string => !!name)
				.join(' | ');

			const conversionCurrencies = this.getConversionCurrencies(record, activePaymentAccount, relatedAccount);

			return {
				...record,
				relatedPaymentAccountName: relatedPaymentAccountName || 'related account',
				...conversionCurrencies,
			};
		});
	}

	private getConversionCurrencies(
		record: IPaymentRepresentationModel,
		activePaymentAccount: IPaymentAccountModel | undefined,
		relatedPaymentAccount: IPaymentAccountModel | undefined
	): Pick<IPaymentRepresentationModel, 'conversionSourceCurrency' | 'conversionDestinationCurrency'> {
		if (
			record.conversionMultiplier === undefined ||
			!activePaymentAccount?.currency ||
			!relatedPaymentAccount?.currency ||
			activePaymentAccount.currency === relatedPaymentAccount.currency
		) {
			return {};
		}

		return record.expense > 0
			? {
					conversionSourceCurrency: activePaymentAccount.currency,
					conversionDestinationCurrency: relatedPaymentAccount.currency,
				}
			: {
					conversionSourceCurrency: relatedPaymentAccount.currency,
					conversionDestinationCurrency: activePaymentAccount.currency,
				};
	}

	private resolvePendingRelatedOperation(): void {
		const activePaymentAccountId = this.activePaymentAccountIdSignal();
		const pendingOperationKey =
			this.relatedTransferNavigationService.getPendingTargetOperationKey(activePaymentAccountId);

		if (!pendingOperationKey) {
			return;
		}

		const operationRow = this.findRenderedOperationRow(pendingOperationKey);

		if (!operationRow) {
			return;
		}

		this.highlightedRelatedOperationKey = pendingOperationKey;
		this.highlightedRelatedOperationElement = operationRow;
		operationRow.classList.add('payments-history__row--related-target');
		this.scrollAndFocus(operationRow);
		this.relatedTransferNavigationService.completePendingTarget(activePaymentAccountId, pendingOperationKey);
		this.scheduleRelatedOperationHighlightClear();
	}

	private findRenderedOperationRow(operationKey: Guid): HTMLElement | undefined {
		const hostElement: HTMLElement = this.hostElement.nativeElement;

		return Array.from(hostElement.querySelectorAll<HTMLElement>('[data-operation-key]')).find(
			operationRow => operationRow.dataset.operationKey === operationKey.toString()
		);
	}

	private scrollAndFocus(operationRow: HTMLElement): void {
		const shouldReduceMotion = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

		operationRow.scrollIntoView({
			behavior: shouldReduceMotion ? 'auto' : 'smooth',
			block: 'center',
		});
		operationRow.focus({ preventScroll: true });
	}

	private scheduleRelatedOperationHighlightClear(): void {
		this.cancelRelatedOperationHighlightClear();

		this.relatedOperationHighlightTimeout = globalThis.setTimeout(() => {
			this.highlightedRelatedOperationElement?.classList.remove('payments-history__row--related-target');
			this.highlightedRelatedOperationElement = undefined;
			this.highlightedRelatedOperationKey = undefined;
			this.relatedOperationHighlightTimeout = undefined;
			this.changeDetectorRef.markForCheck();
		}, 4_000);
	}

	private clearRelatedOperationHighlight(): void {
		this.cancelRelatedOperationHighlightClear();
		this.highlightedRelatedOperationElement?.classList.remove('payments-history__row--related-target');
		this.highlightedRelatedOperationElement = undefined;
		this.highlightedRelatedOperationKey = undefined;
	}

	private cancelRelatedOperationHighlightClear(): void {
		if (this.relatedOperationHighlightTimeout) {
			globalThis.clearTimeout(this.relatedOperationHighlightTimeout);
			this.relatedOperationHighlightTimeout = undefined;
		}
	}
}
