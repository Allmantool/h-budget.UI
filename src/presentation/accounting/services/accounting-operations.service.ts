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
import { CategoryModel } from '../../../domain/models/accounting/category.model';
import { PaymentOperationModel } from '../../../domain/models/accounting/payment-operation.model';
import { AccountingGridRecord } from '../models/accounting-grid-record';

@Injectable()
export class AccountingOperationsService {
	@Select(getActivePaymentAccountId)
	public activePaymentAccountId$!: Observable<string>;

	@Select(getCategoryAsNodesMap)
	public categoriesMap$!: Observable<Map<string, CategoryModel>>;

	@Select(getContractorAsNodesMap)
	public contractorsMap$!: Observable<Map<string, Guid>>;

	public activePaymentAccountIdSignal: Signal<string>;

	public categoriesMapSignal: Signal<Map<string, CategoryModel>>;
	public contractorsMapSignal: Signal<Map<string, Guid>>;

	constructor(
		private readonly paymentOperationsProvider: PaymentOperationsProvider,
		private readonly store: Store
	) {
		this.activePaymentAccountIdSignal = toSignal(this.activePaymentAccountId$, { initialValue: '' });
		this.categoriesMapSignal = toSignal(this.categoriesMap$, { initialValue: new Map<string, CategoryModel>() });
		this.contractorsMapSignal = toSignal(this.contractorsMap$, { initialValue: new Map<string, Guid>() });
	}

	public async deleteOperationByGuidAsync(operationGuid: Guid): Promise<Result<boolean>> {
		if (_.isNil(operationGuid)) {
			new Result({
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
					isSucceeded: true && deleteResponse.isSucceeded,
				})
		);
	}

	public async addOperationAsync(): Promise<Result<AccountingGridRecord>> {
		const newRecord: AccountingGridRecord = {
			id: Guid.EMPTY,
			operationDate: new Date(),
			contractor: '',
			category: '',
			income: 0,
			expense: 0,
			balance: 0,
			comment: '',
		};

		this.store.dispatch(new SetActiveAccountingOperation(newRecord.id));

		return await firstValueFrom(this.store.dispatch(new Add(newRecord))).then(
			() =>
				new Result({
					payload: newRecord,
					isSucceeded: true,
				})
		);
	}

	public async updateOperationAsync(gridRecord: AccountingGridRecord): Promise<Result<boolean>> {
		const payload: PaymentOperationModel = {
			key: gridRecord.id,
			operationDate: gridRecord.operationDate,
			comment: gridRecord.comment,
			contractorId: this.contractorsMapSignal().get(gridRecord.contractor)!,
			categoryId: this.categoriesMapSignal().get(gridRecord.category)!.key,
			paymentAccountId: Guid.parse(this.activePaymentAccountIdSignal()),
			amount: gridRecord.expense === 0 ? gridRecord.income : gridRecord.expense,
		};

		switch (payload.key) {
			case Guid.EMPTY: {
				const saveResponse = await firstValueFrom(
					this.paymentOperationsProvider.savePaymentOperation(this.activePaymentAccountIdSignal(), payload)
				);

				gridRecord.id = Guid.parse(saveResponse.payload.paymentOperationId);

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

				gridRecord.id = Guid.parse(updateResponse.payload.paymentOperationId);
			}
		}

		return await firstValueFrom(this.store.dispatch(new Edit(gridRecord))).then(
			() =>
				new Result({
					isSucceeded: true,
				})
		);
	}
}
