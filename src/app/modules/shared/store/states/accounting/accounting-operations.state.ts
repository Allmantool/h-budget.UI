import { Injectable } from '@angular/core';

import { Action, State, StateContext } from '@ngxs/store';
import * as _ from 'lodash';
import { nameof } from 'ts-simple-nameof';

import { AccountingOperationsTableState } from './accounting-operations-table.state';
import { AddRange, Edit, Add, Delete } from './actions/accounting.actions';
import { IAccountingOperationsStateModel } from './models/accounting-state.model';
import { CurrencyAbbrevitions } from '../../../constants/rates-abbreviations';
import { AccountingGridRecord } from '../../../../../../presentation/accounting/models/accounting-grid-record';

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
	@Action(Add)
	add(
		{ getState, patchState }: StateContext<IAccountingOperationsStateModel>,
		{ accountingRecord }: Add
	): void {
		const state = getState();

		const records = _.orderBy(
			[...state.operationRecords, accountingRecord],
			[nameof<AccountingGridRecord>((r) => r.operationDate)],
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
			operationRecords: [
				..._.orderBy(
					records,
					[nameof<AccountingGridRecord>((r) => r.operationDate)],
					['asc']
				),
			],
		});
	}

	@Action(Edit)
	edit(
		{ getState, patchState }: StateContext<IAccountingOperationsStateModel>,
		{ accountingRecord }: Edit
	): void {
		const records = [...getState().operationRecords];

		const updatedItemIndex = _.findIndex(records, (r) => r.id === accountingRecord.id);

		records.splice(updatedItemIndex, 1, accountingRecord);

		patchState({
			operationRecords: [
				..._.orderBy(
					records,
					[nameof<AccountingGridRecord>((r) => r.operationDate)],
					['asc']
				),
			],
		});
	}

	@Action(Delete)
	delete(
		{ getState, patchState }: StateContext<IAccountingOperationsStateModel>,
		{ accountingGuid }: Delete
	): void {
		const state = getState();

		const orderedRecords = _.chain(state.operationRecords)
			.filter(function (record) {
				return record.id !== accountingGuid;
			})
			.sortBy(nameof<AccountingGridRecord>((r) => r.operationDate))
			.value();

		patchState({
			operationRecords: [...orderedRecords],
		});
	}
}
