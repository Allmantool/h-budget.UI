import { computed, Injectable, signal, Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';

import _ from 'lodash';

import { Mapper } from '@dynamic-mapper/angular';
import { Select, Store } from '@ngxs/store';
import { map, Observable, take, tap } from 'rxjs';
import { Guid } from 'typescript-guid';

import { IPaymentsHistoryService } from './interfaces/Ipayments-history.service';
import { SetInitialPaymentOperations } from '../../../app/modules/shared/store/states/accounting/actions/payment-operation.actions';
import { getAccountPayments } from '../../../app/modules/shared/store/states/accounting/selectors/accounting.selectors';
import { getSelectedRecordGuid } from '../../../app/modules/shared/store/states/accounting/selectors/table-options.selectors';
import { PaymentRepresentationsMappingProfile } from '../../../data/providers/accounting/mappers/payment-representations.mapping.profile';
import { PaymensHistoryProvider } from '../../../data/providers/accounting/payments-history.provider';
import { IPaymentOperationModel } from '../../../domain/models/accounting/payment-operation.model';
import { IPaymentRepresentationModel } from '../models/operation-record';

@Injectable()
export class PaymentsHistoryService implements IPaymentsHistoryService {
	@Select(getAccountPayments)
	public accountPayments$!: Observable<IPaymentOperationModel[]>;

	@Select(getAccountPayments)
	accountingRecords$!: Observable<IPaymentOperationModel[]>;

	@Select(getSelectedRecordGuid)
	selectedRecordGuid$!: Observable<Guid | null>;

	private isNewRecordSignal: Signal<boolean> = signal(false);

	public accountPaymentsSignal: Signal<IPaymentOperationModel[]> = toSignal(this.accountPayments$, {
		initialValue: [],
	});

	public selectedRecordGuidSignal: Signal<Guid | null> = toSignal(this.selectedRecordGuid$, {
		initialValue: null,
	});

	public accountingRecordsSignal = toSignal(this.accountingRecords$, { initialValue: [] });

	constructor(
		private readonly mapper: Mapper,
		private readonly store: Store,
		private readonly paymensHistoryProvider: PaymensHistoryProvider
	) {
		this.isNewRecordSignal = computed(() => _.some(this.accountPaymentsSignal(), { key: Guid.EMPTY }));
	}

	public refreshPaymentOperationsStore(paymentAccountId: string) {
		const operationsHistory$ = this.paymensHistoryProvider.getOperationsHistoryForPaymentAccount(paymentAccountId);

		return operationsHistory$
			.pipe(
				take(1),
				map(history => _.map(history, h => h.record))
			)
			.subscribe(operationRecords => {
				this.store.dispatch(new SetInitialPaymentOperations(operationRecords));
			});
	}

	public refreshPaymentsHistory(paymentAccountId: string): Observable<IPaymentRepresentationModel[]> {
		const operationsHistory$ = this.paymensHistoryProvider.getOperationsHistoryForPaymentAccount(paymentAccountId);

		return operationsHistory$.pipe(
			take(1),
			tap(history => {
				if (!this.isNewRecordSignal()) {
					this.store.dispatch(new SetInitialPaymentOperations(_.map(history, h => h.record)));
				}
			}),
			map(history => {
				const paymentsRepresentation = this.mapper?.map(
					PaymentRepresentationsMappingProfile.PaymentHistoryToRepresentationModel,
					history
				);

				if (this.isNewRecordSignal()) {
					return [...paymentsRepresentation, this.paymentOperationAsHistoryRecord()];
				}

				return paymentsRepresentation;
			})
		);
	}

	public paymentOperationAsHistoryRecord(): IPaymentRepresentationModel {
		const selectedOperationGuid = this.selectedRecordGuidSignal()!;

		const payload = _.find(this.accountingRecordsSignal(), function (r) {
			return r.key.equals(selectedOperationGuid);
		});

		if (_.isNil(payload) || payload.key === Guid.EMPTY) {
			return {
				key: Guid.EMPTY,
				operationDate: new Date(),
				contractor: '',
				category: '',
				comment: '',
				income: 0,
				expense: 0,
			} as IPaymentRepresentationModel;
		}

		return this.mapper?.map(PaymentRepresentationsMappingProfile.PaymentOperationToRepresentationModel, payload);
	}
}
