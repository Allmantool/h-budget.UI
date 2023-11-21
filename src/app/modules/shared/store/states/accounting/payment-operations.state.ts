import { Injectable } from '@angular/core';

import * as _ from 'lodash';

import { Action, State, StateContext } from '@ngxs/store';
import { nameof } from 'ts-simple-nameof';

import { AccountingOperationsTableState } from './accounting-operations-table.state';
import { Add, AddRange, Delete, Edit, SetInitialPaymentOperations } from './actions/payment-operation.actions';
import { IAccountingOperationsStateModel } from './models/accounting-state.model';
import { AccountingGridRecord } from '../../../../../../presentation/accounting/models/accounting-grid-record';
import { CurrencyAbbrevitions } from '../../../constants/rates-abbreviations';

@State<IAccountingOperationsStateModel>({
	name: 'accountingOperations',
	defaults: {
		activeCurrency: CurrencyAbbrevitions.BYN,
		operationRecords: [],
	},
	children: [AccountingOperationsTableState],
})
@Injectable()
export class AccountingOperationsState {
	@Action(SetInitialPaymentOperations)
	setInitialPaymentOperations(
		{ patchState }: StateContext<IAccountingOperationsStateModel>,
		{ paymentOperations }: SetInitialPaymentOperations
	): void {
		patchState({
			operationRecords: [...paymentOperations],
		});
	}

	@Action(Add)
	add({ getState, patchState }: StateContext<IAccountingOperationsStateModel>, { accountingRecord }: Add): void {
		const state = getState();

		const records = _.orderBy(
			[...state.operationRecords, accountingRecord],
			[nameof<AccountingGridRecord>(r => r.operationDate)],
			['asc']
		);

		patchState({
			operationRecords: records,
		});
	}

	@Action(AddRange)
	addRange(
		{ getState, patchState }: StateContext<IAccountingOperationsStateModel>,
		{ accountingRecord }: AddRange
	): void {
		const state = getState();

		const records = _.concat(
			state.operationRecords,
			_.differenceWith(accountingRecord, state.operationRecords, _.isEqual.bind(this))
		);

		patchState({
			operationRecords: [..._.orderBy(records, [nameof<AccountingGridRecord>(r => r.operationDate)], ['asc'])],
		});
	}

	@Action(Edit)
	edit({ getState, patchState }: StateContext<IAccountingOperationsStateModel>, { accountingRecord }: Edit): void {
		const records = [...getState().operationRecords];

		const updatedItemIndex = _.findIndex(records, r => r.id === accountingRecord.id);

		records.splice(updatedItemIndex, 1, accountingRecord);

		patchState({
			operationRecords: [..._.orderBy(records, [nameof<AccountingGridRecord>(r => r.operationDate)], ['asc'])],
		});
	}

	@Action(Delete)
	delete({ getState, patchState }: StateContext<IAccountingOperationsStateModel>, { accountingGuid }: Delete): void {
		const state = getState();

		const orderedRecords = _.chain(state.operationRecords)
			.filter(function (record) {
				return record.id !== accountingGuid;
			})
			.sortBy(nameof<AccountingGridRecord>(r => r.operationDate))
			.value();

		patchState({
			operationRecords: [...orderedRecords],
		});
	}
}
