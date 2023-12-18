import {
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
import { BehaviorSubject, combineLatest, filter, Observable, take } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { Guid } from 'typescript-guid';

import { IAccountingOperationsTableOptions } from '../../../../app/modules/shared/store/models/accounting/accounting-table-options';
import { SetActiveAccountingOperation } from '../../../../app/modules/shared/store/states/accounting/actions/accounting-table-options.actions';
import { getAccountingRecords } from '../../../../app/modules/shared/store/states/accounting/selectors/accounting.selectors';
import {
	getActivePaymentAccount,
	getActivePaymentAccountId,
} from '../../../../app/modules/shared/store/states/accounting/selectors/payment-account.selector';
import { getAccountingTableOptions } from '../../../../app/modules/shared/store/states/accounting/selectors/table-options.selectors';
import { SetInitialCategories } from '../../../../app/modules/shared/store/states/handbooks/actions/category.actions';
import { SetInitialContractors } from '../../../../app/modules/shared/store/states/handbooks/actions/counterparty.actions';
import { DefaultCategoriesProvider } from '../../../../data/providers/accounting/categories.provider';
import { DefaultContractorsProvider } from '../../../../data/providers/accounting/contractors.provider';
import { IPaymentAccountModel } from '../../../../domain/models/accounting/payment-account.model';
import { IPaymentRepresentationModel } from '../../models/operation-record';
import { PaymentsHistoryService } from '../../services/payments-history.service';

@Component({
	selector: 'payments-history',
	templateUrl: './payments-history.component.html',
	styleUrls: ['./payments-history.component.css'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentsHistoryComponent implements OnInit {
	private readonly destroyRef = inject(DestroyRef);

	@Select(getAccountingRecords)
	public accountPaymentRecords$!: Observable<IPaymentRepresentationModel[]>;

	@Select(getActivePaymentAccount)
	public activePaymentAccound$!: Observable<IPaymentAccountModel>;

	@Select(getActivePaymentAccountId)
	public getActivePaymentAccountId$!: Observable<Guid | undefined>;

	@Select(getAccountingTableOptions)
	public accountingTableOptions$!: Observable<IAccountingOperationsTableOptions>;

	public activePaymentAccountSignal: Signal<IPaymentAccountModel> = toSignal(this.activePaymentAccound$, {
		initialValue: {} as IPaymentAccountModel,
	});

	public activePaymentAccountIdSignal: Signal<Guid | undefined> = toSignal(this.getActivePaymentAccountId$, {
		initialValue: undefined,
	});

	public accountPaymentsSignal: Signal<IPaymentRepresentationModel[]> = toSignal(this.accountPaymentRecords$, {
		initialValue: [],
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
		private readonly contractorsProvider: DefaultContractorsProvider,
		private readonly categoriesProvider: DefaultCategoriesProvider,
		private readonly paymentsHistoryService: PaymentsHistoryService,
		private readonly router: Router,
		private readonly store: Store
	) {
		if (_.isNil(this.activePaymentAccountSignal())) {
			this.navigateToPaymentAccountsAsync();
			return;
		}

		this.paymentAccountGeneralInfoSignal = computed(
			() =>
				`${this.activePaymentAccountSignal()?.key?.toString()} ${this.activePaymentAccountSignal().emitter} | ${
					this.activePaymentAccountSignal().description
				}`
		);
	}

	public ngOnInit(): void {
		const inquireContractors$ = this.contractorsProvider.getContractors().pipe(take(1));
		const inquireCategories$ = this.categoriesProvider.getCategoriries().pipe(take(1));

		combineLatest([inquireCategories$, inquireContractors$])
			.pipe(
				take(1),
				filter(([categories, contractors]) => !_.isEmpty(categories) && !_.isEmpty(contractors)),
				switchMap(([categories, contractors]) => {
					this.store.dispatch(new SetInitialContractors(contractors));
					this.store.dispatch(new SetInitialCategories(categories));

					return this.paymentsHistoryService.refreshPaymentsHistory(
						this.activePaymentAccountSignal().key!.toString(),
						true
					);
				})
			)
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe(payments => this.dataSource$.next(payments));

		this.accountingTableOptions$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(options => {
			this.clickedRowGuids.clear();
			this.clickedRowGuids.add(options.selectedRecordGuid);
		});

		this.accountPaymentRecords$
			.pipe(
				takeUntilDestroyed(this.destroyRef),
				switchMap(() => {
					const paymentAccountId = this.activePaymentAccountIdSignal()?.toString();
					return this.paymentsHistoryService.refreshPaymentsHistory(paymentAccountId!);
				})
			)
			.subscribe(payments => {
				if (_.some(this.accountPaymentsSignal(), { key: Guid.EMPTY })) {
					const emptyRecord = _.find(this.accountPaymentsSignal(), ['key', Guid.EMPTY]);

					return this.dataSource$.next([...payments, emptyRecord!]);
				}

				return this.dataSource$.next(payments);
			});
	}

	public selectRow(record: IPaymentRepresentationModel): void {
		this.store.dispatch(new SetActiveAccountingOperation(record.key));
	}

	public async navigateToPaymentAccountsAsync(): Promise<void> {
		this.store.dispatch(new SetActiveAccountingOperation(undefined));
		await this.router.navigate(['/dashboard/accounting'], { relativeTo: null });
	}
}
