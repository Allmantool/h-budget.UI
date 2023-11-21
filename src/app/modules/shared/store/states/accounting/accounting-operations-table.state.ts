import { Injectable } from '@angular/core';

import { Action, State, StateContext } from '@ngxs/store';

import { SetActiveAccountingOperation } from './actions/accounting-table-options.actions';
import { IAccountingTableStateModel } from './models/accounting-table-state.model';
import { AccountingOperationsTableOptions } from '../../models/accounting/accounting-table-options';

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
	setActive({ patchState }: StateContext<IAccountingTableStateModel>, { id }: SetActiveAccountingOperation): void {
		patchState({
			tableOptions: { selectedRecordGuid: id } as AccountingOperationsTableOptions,
		});
	}
}
