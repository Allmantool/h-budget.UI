import { Injectable } from '@angular/core';

import * as _ from 'lodash';

import { Action, State, StateContext } from '@ngxs/store';
import { nameof } from 'ts-simple-nameof';

import { AccountingOperationsTableState } from './accounting-operations-table.state';
import { Add, AddRange, Delete, Edit, SetInitialPaymentOperations } from './actions/payment-operation.actions';
import { IAccountingOperationsStateModel } from './models/accounting-state.model';
import { IPaymentRepresentationModel } from '../../../../../../presentation/accounting/models/operation-record';
import { CurrencyAbbreviations } from '../../../constants/rates-abbreviations';

@State<IAccountingOperationsStateModel>({
	name: 'accountingOperations',
	defaults: {
		activeCurrency: CurrencyAbbreviations.BYN,
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
	add(
		{ getState, patchState }: StateContext<IAccountingOperationsStateModel>,
		{ paymentOperation: accountingRecord }: Add
	): void {
		const state = getState();

		const records = _.orderBy(
			[...state.operationRecords, accountingRecord],
			[nameof<IPaymentRepresentationModel>(r => r.operationDate)],
			['asc']
		);

		patchState({
			operationRecords: records,
		});
	}

	@Action(AddRange)
	addRange(
		{ getState, patchState }: StateContext<IAccountingOperationsStateModel>,
		{ paymentOperations: accountingRecord }: AddRange
	): void {
		const state = getState();

		const records = _.concat(
			state.operationRecords,
			_.differenceWith(accountingRecord, state.operationRecords, _.isEqual.bind(this))
		);

		patchState({
			operationRecords: [
				..._.orderBy(records, [nameof<IPaymentRepresentationModel>(r => r.operationDate)], ['asc']),
			],
		});
	}

	@Action(Edit)
	edit(
		{ getState, patchState }: StateContext<IAccountingOperationsStateModel>,
		{ paymentOperation: accountingRecord }: Edit
	): void {
		const records = [...getState().operationRecords];

		const updatedItemIndex = _.findIndex(records, r => r.key === accountingRecord.key);

		records.splice(updatedItemIndex, 1, accountingRecord);

		patchState({
			operationRecords: [
				..._.orderBy(records, [nameof<IPaymentRepresentationModel>(r => r.operationDate)], ['asc']),
			],
		});
	}

	@Action(Delete)
	delete(
		{ getState, patchState }: StateContext<IAccountingOperationsStateModel>,
		{ paymentOperationId: accountingGuid }: Delete
	): void {
		const state = getState();

		const orderedRecords = _.chain(state.operationRecords)
			.filter(function (record) {
				return record.key !== accountingGuid;
			})
			.sortBy(nameof<IPaymentRepresentationModel>(r => r.operationDate))
			.value();

		patchState({
			operationRecords: [...orderedRecords],
		});
	}
}
