import {
	AfterViewInit,
	ChangeDetectionStrategy,
	Component,
	computed,
	DestroyRef,
	inject,
	OnInit,
	signal,
	Signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';

import * as _ from 'lodash';

import { Select, Store } from '@ngxs/store';
import { BehaviorSubject, Observable } from 'rxjs';
import { exhaustMap, tap } from 'rxjs/operators';
import { Guid } from 'typescript-guid';

import { IAccountingOperationsTableOptions } from '../../../../app/modules/shared/store/models/accounting/accounting-table-options';
import { SetActiveAccountingOperation } from '../../../../app/modules/shared/store/states/accounting/actions/accounting-table-options.actions';
import { getAccountPayments } from '../../../../app/modules/shared/store/states/accounting/selectors/accounting.selectors';
import {
	getActivePaymentAccount,
	getActivePaymentAccountId,
} from '../../../../app/modules/shared/store/states/accounting/selectors/payment-account.selector';
import { getAccountingTableOptions } from '../../../../app/modules/shared/store/states/accounting/selectors/table-options.selectors';
import { IPaymentAccountModel } from '../../../../domain/models/accounting/payment-account.model';
import { IPaymentOperationModel } from '../../../../domain/models/accounting/payment-operation.model';
import { IPaymentRepresentationModel } from '../../models/operation-record';
import { AccountsService } from '../../services/accounts.service';
import { HandbooksService } from '../../services/handbooks.service';
import { PaymentsHistoryService } from '../../services/payments-history.service';

@Component({
	selector: 'payments-history',
	templateUrl: './payments-history.component.html',
	styleUrls: ['./payments-history.component.css'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentsHistoryComponent implements OnInit, AfterViewInit {
	private readonly destroyRef = inject(DestroyRef);

	@Select(getAccountPayments)
	public accountPayments$!: Observable<IPaymentOperationModel[]>;

	@Select(getActivePaymentAccount)
	public activePaymentAccound$!: Observable<IPaymentAccountModel>;

	@Select(getActivePaymentAccountId)
	public getActivePaymentAccountId$!: Observable<Guid>;

	@Select(getAccountingTableOptions)
	public accountingTableOptions$!: Observable<IAccountingOperationsTableOptions>;

	public activePaymentsAccountSignal: Signal<IPaymentAccountModel> = toSignal(this.activePaymentAccound$, {
		initialValue: {} as IPaymentAccountModel,
	});

	public activePaymentAccountIdSignal: Signal<Guid> = toSignal(this.getActivePaymentAccountId$, {
		initialValue: Guid.EMPTY,
	});

	public paymentAccountGeneralInfoSignal: Signal<string> = signal('');

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

	constructor(
		private readonly handbooksService: HandbooksService,
		private readonly paymentsHistoryService: PaymentsHistoryService,
		private readonly accountsService: AccountsService,
		private readonly router: Router,
		private readonly store: Store
	) {
		this.paymentAccountGeneralInfoSignal = computed(
			() => `${this.activePaymentAccountIdSignal()?.toString()}
				${this.activePaymentsAccountSignal().emitter} | ${this.activePaymentsAccountSignal().description}`
		);
	}

	public async ngOnInit(): Promise<void> {
		if (_.isNil(this.activePaymentsAccountSignal())) {
			await this.navigateToPaymentAccountsAsync();
			return;
		}

		this.handbooksService.setupHandbooksStore();

		this.accountingTableOptions$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(options => {
			this.clickedRowGuids.clear();
			this.clickedRowGuids.add(options?.selectedRecordGuid);
		});
	}

	public ngAfterViewInit(): void {
		this.accountPayments$
			.pipe(
				takeUntilDestroyed(this.destroyRef),
				exhaustMap(() => {
					return this.paymentsHistoryService.refreshPaymentsHistory(this.activePaymentAccountIdSignal());
				}),
				tap(() => this.accountsService.refreshAccounts(this.activePaymentAccountIdSignal()))
			)
			.subscribe(payments => this.dataSource$.next(payments));
	}

	public selectRow(record: IPaymentRepresentationModel): void {
		this.store.dispatch(new SetActiveAccountingOperation(record.key));
	}

	public async navigateToPaymentAccountsAsync(): Promise<void> {
		this.store.dispatch(new SetActiveAccountingOperation(undefined));
		await this.router.navigate(['/dashboard/accounting'], { relativeTo: null });
	}
}
