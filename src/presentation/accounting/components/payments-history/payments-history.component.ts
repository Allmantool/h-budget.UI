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
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { SseService } from 'infrastructure/sse-service';

import * as _ from 'lodash';

import { Select, Store } from '@ngxs/store';
import { isFuture } from 'date-fns';
import { BehaviorSubject, filter, forkJoin, map, Observable, Subject } from 'rxjs';
import { exhaustMap } from 'rxjs/operators';
import { Guid } from 'typescript-guid';

import { AccountingCurrencyFormatPipe } from '../../../../app/modules/shared/pipes/accounting-currency.pipe';
import { IAccountingOperationsTableOptions } from '../../../../app/modules/shared/store/models/accounting/accounting-table-options';
import { SetActiveAccountingOperation } from '../../../../app/modules/shared/store/states/accounting/actions/accounting-table-options.actions';
import { getAccountPayments } from '../../../../app/modules/shared/store/states/accounting/selectors/accounting.selectors';
import {
	getActivePaymentAccountId,
	getPaymentAccounts,
} from '../../../../app/modules/shared/store/states/accounting/selectors/payment-account.selector';
import { getAccountingTableOptions } from '../../../../app/modules/shared/store/states/accounting/selectors/table-options.selectors';
import { IPaymentAccountModel } from '../../../../domain/models/accounting/payment-account.model';
import { IPaymentOperationModel } from '../../../../domain/models/accounting/payment-operation.model';
import { IPaymentRepresentationModel } from '../../models/operation-record';
import { AccountsService } from '../../services/accounts.service';
import { HandbooksService } from '../../services/handbooks.service';
import { PaymentsHistoryService } from '../../services/payments-history.service';
import { RelatedTransferNavigationService } from '../../services/related-transfer-navigation.service';
import { TransferProjectionSynchronizationService } from '../../services/transfer-projection-synchronization.service';
import { PaymentEditorLeaveService } from '../../services/payment-editor-leave.service';

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
		MatTableModule,
		AccountingCurrencyFormatPipe,
	],
})
export class PaymentsHistoryComponent implements OnInit, OnDestroy, AfterViewInit {
	private readonly destroyRef = inject(DestroyRef);
	private readonly hostElement = inject<ElementRef<HTMLElement>>(ElementRef);
	private readonly relatedTransferNavigationRequests$ = new Subject<IPaymentRepresentationModel>();
	private relatedOperationHighlightTimeout?: ReturnType<typeof setTimeout>;
	private highlightedRelatedOperationElement?: HTMLElement;
	private isProjectionRefreshActive = false;
	private hasQueuedProjectionRefresh = false;
	private isDestroyed = false;

	@Select(getAccountPayments)
	public accountPayments$!: Observable<IPaymentOperationModel[]>;

	@Select(getActivePaymentAccountId)
	public getActivePaymentAccountId$!: Observable<Guid>;

	@Select(getPaymentAccounts)
	public paymentAccounts$!: Observable<IPaymentAccountModel[]>;

	@Select(getAccountingTableOptions)
	public accountingTableOptions$!: Observable<IAccountingOperationsTableOptions>;

	public activePaymentAccountIdSignal: Signal<Guid> = toSignal(this.getActivePaymentAccountId$, {
		initialValue: Guid.EMPTY,
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

	constructor(
		private readonly handbooksService: HandbooksService,
		private readonly paymentsHistoryService: PaymentsHistoryService,
		private readonly accountsService: AccountsService,
		private readonly store: Store,
		private readonly sseService: SseService,
		private readonly transferProjectionSynchronizationService: TransferProjectionSynchronizationService,
		public readonly relatedTransferNavigationService: RelatedTransferNavigationService,
		private readonly changeDetectorRef: ChangeDetectorRef,
		private readonly paymentEditorLeaveService: PaymentEditorLeaveService
	) {
		afterEveryRender({
			read: () => this.resolvePendingRelatedOperation(),
		});
	}

	public ngOnInit(): void {
		this.handbooksService.setupHandbooksStore();

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
		this.accountPayments$
			.pipe(
				takeUntilDestroyed(this.destroyRef),
				exhaustMap(() =>
					forkJoin({
						payments: this.paymentsHistoryService.refreshPaymentsHistory(
							this.activePaymentAccountIdSignal()
						),
						balance: this.accountsService.refreshAccounts(this.activePaymentAccountIdSignal()),
					})
				)
			)
			.subscribe(payload => this.publishPayments(payload.payments));
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

		this.store.dispatch(new SetActiveAccountingOperation(record.key));
	}

	public async beginNewPayment(): Promise<void> {
		if (!(await this.paymentEditorLeaveService.canLeave())) {
			return;
		}

		this.store.dispatch(new SetActiveAccountingOperation(undefined));
	}

	public isFuturePayment = (record: IPaymentRepresentationModel): boolean => isFuture(record.operationDate);

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
			payments: this.paymentsHistoryService.refreshPaymentsHistory(accountId),
			balance: this.accountsService.refreshAccounts(accountId),
		}).pipe(map(payload => payload.payments));
	}

	private requestProjectionRefresh(): void {
		if (this.isDestroyed) {
			return;
		}

		if (this.isProjectionRefreshActive) {
			this.hasQueuedProjectionRefresh = true;
			return;
		}

		this.isProjectionRefreshActive = true;
		this.refreshActiveAccountProjection()
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe({
				next: payments => this.publishPayments(payments),
				error: () => this.completeProjectionRefresh(),
				complete: () => this.completeProjectionRefresh(),
			});
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
		this.transferProjectionSynchronizationService.completeProjectedOperations(
			activePaymentAccountId,
			displayRecords.map(record => record.key)
		);
	}

	private withRelatedPaymentAccountNames(records: IPaymentRepresentationModel[]): IPaymentRepresentationModel[] {
		const paymentAccounts = this.store.selectSnapshot(getPaymentAccounts);
		const activePaymentAccount = paymentAccounts.find(
			account => account.key?.equals(this.activePaymentAccountIdSignal()) === true
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
