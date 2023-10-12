import { Injectable } from '@angular/core';
import { State, Action, StateContext } from '@ngxs/store';

import { IAccountingTableStateModel } from './models/accounting-table-state.model';
import { AccountingOperationsTableOptions } from '../../models/accounting/accounting-table-options';
import { SetActiveAccountingOperation } from './actions/accounting-table-options.actions';

@State<IAccountingTableStateModel>({
	name: 'accountingOpertaionsTableState',
	defaults: {
		tableOptions: {} as AccountingOperationsTableOptions,
	},
	children: [],
})
@Injectable()
export class AccountingOperationsTableState {
	@Action(SetActiveAccountingOperation)
	setActive(
		{ patchState }: StateContext<IAccountingTableStateModel>,
		{ id }: SetActiveAccountingOperation
	): void {
		patchState({
			tableOptions: { selectedRecordGuid: id } as AccountingOperationsTableOptions,
		});
	}
}
