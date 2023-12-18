import { Injectable, Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';

import _ from 'lodash';

import { Select, Store } from '@ngxs/store';
import { map, Observable, take } from 'rxjs';
import { Guid } from 'typescript-guid';

import { IPaymentsHistoryService } from './Ipayments-history.service';
import { SetInitialPaymentOperations } from '../../../app/modules/shared/store/states/accounting/actions/payment-operation.actions';
import { getAccountingRecords } from '../../../app/modules/shared/store/states/accounting/selectors/accounting.selectors';
import { getSelectedRecordGuid } from '../../../app/modules/shared/store/states/accounting/selectors/table-options.selectors';
import { getCategories } from '../../../app/modules/shared/store/states/handbooks/selectors/categories.selectors';
import { getContractors } from '../../../app/modules/shared/store/states/handbooks/selectors/counterparties.selectors';
import { PaymensHistoryProvider } from '../../../data/providers/accounting/payments-history.provider';
import { ICategoryModel } from '../../../domain/models/accounting/category.model';
import { IContractorModel } from '../../../domain/models/accounting/contractor.model.';
import { OperationTypes } from '../../../domain/models/accounting/operation-types';
import { IPaymentOperationModel } from '../../../domain/models/accounting/payment-operation.model';
import { IPaymentRepresentationModel } from '../models/operation-record';

@Injectable()
export class PaymentsHistoryService implements IPaymentsHistoryService {
	@Select(getCategories)
	public categories$!: Observable<ICategoryModel[]>;

	@Select(getContractors)
	public contractors$!: Observable<IContractorModel[]>;

	@Select(getAccountingRecords)
	accountingRecords$!: Observable<IPaymentOperationModel[]>;

	@Select(getSelectedRecordGuid)
	selectedRecordGuid$!: Observable<Guid | null>;

	public categoriesSignal: Signal<ICategoryModel[]> = toSignal(this.categories$, {
		initialValue: {} as ICategoryModel[],
	});

	public contractorsSignal: Signal<IContractorModel[]> = toSignal(this.contractors$, {
		initialValue: {} as IContractorModel[],
	});

	public selectedRecordGuidSignal: Signal<Guid | null> = toSignal(this.selectedRecordGuid$, {
		initialValue: null,
	});

	public accountingRecordsSignal = toSignal(this.accountingRecords$, { initialValue: [] });

	constructor(
		private readonly store: Store,
		private readonly paymensHistoryProvider: PaymensHistoryProvider
	) {}

	public refreshPaymentsHistory(
		paymentAccountId: string,
		updateState: boolean = false
	): Observable<IPaymentRepresentationModel[]> {
		const operationsHistory = this.paymensHistoryProvider.getOperationsHistoryForPaymentAccount(paymentAccountId);

		return operationsHistory.pipe(
			take(1),
			map(operations => {
				if (updateState) {
					this.store.dispatch(new SetInitialPaymentOperations(_.map(operations, op => op.record)));
				}

				const contractors = this.contractorsSignal();
				const categories = this.categoriesSignal();

				return _.map(operations, function (paymentHistory) {
					const targetContractor = _.find(contractors, c =>
						c.key.equals(paymentHistory.record.contractorId)
					)!;
					const targetCategory = _.find(categories, c => c.key.equals(paymentHistory.record.categoryId))!;

					const isIncome = targetCategory?.operationType === OperationTypes.Income;

					const paymentHistoryPayload: IPaymentRepresentationModel = {
						key: paymentHistory.record.key,
						operationDate: paymentHistory.record.operationDate,
						contractor: targetContractor.nameNodes.parseToTreeAsString(),
						category: targetCategory.nameNodes.parseToTreeAsString(),
						comment: paymentHistory.record.comment,
						income: isIncome ? paymentHistory.record.amount : 0,
						expense: isIncome ? 0 : -paymentHistory.record.amount,
						balance: paymentHistory.balance,
					};

					return paymentHistoryPayload;
				});
			})
		);
	}

	public paymentOperationAsHistoryHistoryRecord(): IPaymentRepresentationModel {
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

		const targetContractor = _.find(this.contractorsSignal(), c => c.key.equals(payload.contractorId))!;
		const targetCategory = _.find(this.categoriesSignal(), c => c.key.equals(payload.categoryId))!;

		const isIncome = targetCategory?.operationType === OperationTypes.Income;

		return {
			key: payload.key,
			operationDate: payload.operationDate,
			contractor: targetContractor.nameNodes.parseToTreeAsString(),
			category: targetCategory.nameNodes.parseToTreeAsString(),
			comment: payload.comment,
			income: isIncome ? payload.amount : 0,
			expense: isIncome ? 0 : -payload.amount,
		} as IPaymentRepresentationModel;
	}
}
