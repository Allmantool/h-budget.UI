import { TestBed } from '@angular/core/testing';

import { NgxsModule, Store } from '@ngxs/store';
import { Guid } from 'typescript-guid';

import { ngxsConfig } from '../../../app/modules/shared/store/ngxs.config';
import { AccountingOperationsTableState } from '../../../app/modules/shared/store/states/accounting/accounting-operations-table.state';
import {
	Edit,
	SetInitialPaymentOperations,
} from '../../../app/modules/shared/store/states/accounting/actions/payment-operation.actions';
import { AccountingOperationsState } from '../../../app/modules/shared/store/states/accounting/payment-operations.state';
import { IPaymentOperationModel } from '../../../domain/models/accounting/payment-operation.model';
import { OperationTypes } from '../../../domain/types/operation.types';

describe('accounting operations state safety', () => {
	it('does not replace a confirmed record when an edit targets an unknown operation', () => {
		TestBed.configureTestingModule({
			imports: [NgxsModule.forRoot([AccountingOperationsState, AccountingOperationsTableState], ngxsConfig)],
		});
		const store = TestBed.inject(Store);
		const accountId = Guid.parse('1c12ec59-8875-45c1-9fb0-e4edcf34a074');
		const first = createOperation('11111111-1111-1111-1111-111111111111', accountId);
		const second = createOperation('22222222-2222-2222-2222-222222222222', accountId);

		store.dispatch(new SetInitialPaymentOperations([first, second]));
		store.dispatch(new Edit(createOperation('33333333-3333-3333-3333-333333333333', accountId)));

		const records = store.selectSnapshot(
			(state: { accountingOperations: { operationRecords: IPaymentOperationModel[] } }) =>
				state.accountingOperations.operationRecords
		);
		expect(records.map(record => record.key.toString())).toEqual([first.key.toString(), second.key.toString()]);
	});

	function createOperation(id: string, paymentAccountId: Guid): IPaymentOperationModel {
		return {
			key: Guid.parse(id),
			paymentAccountId,
			operationDate: new Date(),
			contractorId: Guid.EMPTY,
			categoryId: Guid.EMPTY,
			comment: '',
			amount: 1,
			operationType: OperationTypes.Payment,
		};
	}
});
