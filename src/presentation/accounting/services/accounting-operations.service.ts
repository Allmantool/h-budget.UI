import { Injectable } from '@angular/core';

import { Store } from '@ngxs/store';
import { firstValueFrom } from 'rxjs';
import * as _ from 'lodash';
import { Guid } from 'typescript-guid';

import { Result } from 'core/result';
import { Add, Delete, Edit } from '../../../app/modules/shared/store/states/accounting/actions/payment-operation.actions';
import { AccountingGridRecord } from '../models/accounting-grid-record';
import { SetActiveAccountingOperation } from '../../../app/modules/shared/store/states/accounting/actions/accounting-table-options.actions';

@Injectable()
export class AccountingOperationsService {
	constructor(private readonly store: Store) {}

	public async deleteOperationByGuidAsync(operationGuid: Guid): Promise<Result<boolean>> {
		if (_.isNil(operationGuid)) {
			new Result({
				isSucceeded: false,
			});
		}

		return await firstValueFrom(this.store.dispatch(new Delete(operationGuid))).then(
			() =>
				new Result({
					isSucceeded: true,
				})
		);
	}

	public async addOperationAsync(): Promise<Result<AccountingGridRecord>> {
		const newRecord: AccountingGridRecord = {
			id: Guid.create(),
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

	public async updateOperationAsync(accountingRecord: AccountingGridRecord): Promise<Result<boolean>> {
		return await firstValueFrom(this.store.dispatch(new Edit(accountingRecord))).then(
			() =>
				new Result({
					isSucceeded: true,
				})
		);
	}
}
