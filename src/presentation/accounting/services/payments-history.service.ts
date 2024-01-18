import { Injectable, Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';

import _ from 'lodash';

import { Mapper } from '@dynamic-mapper/angular';
import { Select, Store } from '@ngxs/store';
import { map, Observable, take } from 'rxjs';
import { Guid } from 'typescript-guid';

import { IPaymentsHistoryService } from './Ipayments-history.service';
import { SetInitialPaymentOperations } from '../../../app/modules/shared/store/states/accounting/actions/payment-operation.actions';
import { getAccountingRecords } from '../../../app/modules/shared/store/states/accounting/selectors/accounting.selectors';
import { getSelectedRecordGuid } from '../../../app/modules/shared/store/states/accounting/selectors/table-options.selectors';
import { PaymentRepresentationsMappingProfile } from '../../../data/providers/accounting/mappers/payment-representations.mapping.profile';
import { PaymensHistoryProvider } from '../../../data/providers/accounting/payments-history.provider';
import { IPaymentOperationModel } from '../../../domain/models/accounting/payment-operation.model';
import { IPaymentRepresentationModel } from '../models/operation-record';

@Injectable()
export class PaymentsHistoryService implements IPaymentsHistoryService {
	@Select(getAccountingRecords)
	accountingRecords$!: Observable<IPaymentOperationModel[]>;

	@Select(getSelectedRecordGuid)
	selectedRecordGuid$!: Observable<Guid | null>;

	public selectedRecordGuidSignal: Signal<Guid | null> = toSignal(this.selectedRecordGuid$, {
		initialValue: null,
	});

	public accountingRecordsSignal = toSignal(this.accountingRecords$, { initialValue: [] });

	constructor(
		private readonly mapper: Mapper,
		private readonly store: Store,
		private readonly paymensHistoryProvider: PaymensHistoryProvider
	) {}

	public refreshPaymentsHistory(
		paymentAccountId: string,
		updateState: boolean = false
	): Observable<IPaymentRepresentationModel[]> {
		const operationsHistory$ = this.paymensHistoryProvider.getOperationsHistoryForPaymentAccount(paymentAccountId);

		return operationsHistory$.pipe(
			take(1),
			map(operations => {
				if (updateState) {
					this.store.dispatch(new SetInitialPaymentOperations(_.map(operations, op => op.record)));
				}

				return this.mapper?.map(
					PaymentRepresentationsMappingProfile.PaymentHistoryToRepresentationModel,
					operations
				);
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
