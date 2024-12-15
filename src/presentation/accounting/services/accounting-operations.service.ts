import { Injectable, Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';

import * as _ from 'lodash';

import { Select, Store } from '@ngxs/store';
import { firstValueFrom, Observable } from 'rxjs';
import { Guid } from 'typescript-guid';

import { Result } from 'core/result';

import { SetActiveAccountingOperation } from '../../../app/modules/shared/store/states/accounting/actions/accounting-table-options.actions';
import {
	Add,
	Delete,
	Edit,
} from '../../../app/modules/shared/store/states/accounting/actions/payment-operation.actions';
import { getActivePaymentAccountId } from '../../../app/modules/shared/store/states/accounting/selectors/payment-account.selector';
import { getCategoryAsNodesMap } from '../../../app/modules/shared/store/states/handbooks/selectors/categories.selectors';
import { getContractorAsNodesMap } from '../../../app/modules/shared/store/states/handbooks/selectors/counterparties.selectors';
import { PaymentOperationsProvider } from '../../../data/providers/accounting/payment-operations.provider';
import { ICategoryModel } from '../../../domain/models/accounting/category.model';
import { IPaymentOperationModel } from '../../../domain/models/accounting/payment-operation.model';
import { OperationTypes } from '../../../domain/types/operation.types';
import { IPaymentRepresentationModel } from '../models/operation-record';

@Injectable()
export class AccountingOperationsService {
	@Select(getActivePaymentAccountId)
	public activePaymentAccountId$!: Observable<string>;

	@Select(getCategoryAsNodesMap)
	public categoriesMap$!: Observable<Map<string, ICategoryModel>>;

	@Select(getContractorAsNodesMap)
	public contractorsMap$!: Observable<Map<string, Guid>>;

	public activePaymentAccountIdSignal: Signal<string>;

	public categoriesMapSignal: Signal<Map<string, ICategoryModel>>;
	public contractorsMapSignal: Signal<Map<string, Guid>>;

	constructor(
		private readonly paymentOperationsProvider: PaymentOperationsProvider,
		private readonly store: Store
	) {
		this.activePaymentAccountIdSignal = toSignal(this.activePaymentAccountId$, { initialValue: '' });
		this.categoriesMapSignal = toSignal(this.categoriesMap$, { initialValue: new Map<string, ICategoryModel>() });
		this.contractorsMapSignal = toSignal(this.contractorsMap$, { initialValue: new Map<string, Guid>() });
	}

	public async deleteByIdAsync(operationGuid: Guid): Promise<Result<boolean>> {
		if (_.isNil(operationGuid)) {
			return new Result({
				isSucceeded: false,
			});
		}

		const deleteResponse = await firstValueFrom(
			this.paymentOperationsProvider.removePaymentOperation(
				this.activePaymentAccountIdSignal(),
				operationGuid.toString()
			)
		);

		return await firstValueFrom(this.store.dispatch(new Delete(operationGuid))).then(
			() =>
				new Result({
					isSucceeded: deleteResponse.isSucceeded,
				})
		);
	}

	public async addNewAsync(): Promise<Result<IPaymentRepresentationModel>> {
		const newRecord: IPaymentOperationModel = {
			paymentAccountId: Guid.parse(this.activePaymentAccountIdSignal()),
			key: Guid.EMPTY,
			operationDate: new Date(),
			contractorId: Guid.EMPTY,
			categoryId: Guid.EMPTY,
			comment: '',
			amount: 0,
			operationType: OperationTypes.Payment,
		};

		this.store.dispatch(new SetActiveAccountingOperation(newRecord.key));

		return await firstValueFrom(this.store.dispatch(new Add(newRecord))).then(
			() =>
				new Result({
					payload: {
						key: Guid.EMPTY,
						operationDate: new Date(),
						contractor: '',
						category: '',
						income: 0,
						expense: 0,
						comment: '',
						balance: 0,
						operationType: 1,
					},
					isSucceeded: true,
				})
		);
	}

	public async updateAsync(payload: IPaymentOperationModel): Promise<Result<boolean>> {
		switch (payload.key) {
			case Guid.EMPTY: {
				const saveResponse = await firstValueFrom(
					this.paymentOperationsProvider.savePaymentOperation(this.activePaymentAccountIdSignal(), payload)
				);

				payload.key = Guid.parse(saveResponse.payload.paymentOperationId);

				break;
			}
			default: {
				const updateResponse = await firstValueFrom(
					this.paymentOperationsProvider.updatePaymentOperation(
						payload,
						this.activePaymentAccountIdSignal(),
						payload.key.toString()
					)
				);

				payload.key = Guid.parse(updateResponse.payload.paymentOperationId);
				break;
			}
		}

		return await firstValueFrom(this.store.dispatch(new Edit(payload))).then(() => {
			return new Result({
				isSucceeded: true,
			});
		});
	}
}
