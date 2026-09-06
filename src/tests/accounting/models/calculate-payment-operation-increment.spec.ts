import { Guid } from 'typescript-guid';

import { calculatePaymentOperationIncrement } from '../../../domain/models/accounting/calculate-payment-operation-increment';
import { ICategoryModel } from '../../../domain/models/accounting/category.model';
import { PaymentOperationTypes } from '../../../domain/models/accounting/operation-types';
import { IPaymentOperationModel } from '../../../domain/models/accounting/payment-operation.model';
import { OperationTypes } from '../../../domain/types/operation.types';

describe('calculate payment operation increment', () => {
	const expenseCategory: Pick<ICategoryModel, 'operationType'> = {
		operationType: PaymentOperationTypes.Expense,
	};
	const incomeCategory: Pick<ICategoryModel, 'operationType'> = {
		operationType: PaymentOperationTypes.Income,
	};

	it('uses the expense category for the supplied positive payment magnitude', () => {
		const operation = createOperation({
			key: 'ccca2b39-c8b6-4aa8-b44b-3ef2112ff042',
			categoryId: '850935c3-1e14-448f-be1c-30ef6f088fb5',
			amount: 23,
		});

		expect(calculatePaymentOperationIncrement(operation, expenseCategory)).toBe(-23);
	});

	it('normalizes a category-backed income to a positive increment', () => {
		const operation = createOperation({ amount: -23 });

		expect(calculatePaymentOperationIncrement(operation, incomeCategory)).toBe(23);
	});

	it('retains the signed amount for transfers and uncategorized payments', () => {
		const transfer = createOperation({ amount: -23, operationType: OperationTypes.Transfer });
		const uncategorizedPayment = createOperation({ amount: -23, categoryId: Guid.EMPTY.toString() });

		expect(calculatePaymentOperationIncrement(transfer, expenseCategory)).toBe(-23);
		expect(calculatePaymentOperationIncrement(uncategorizedPayment, expenseCategory)).toBe(-23);
	});

	function createOperation(overrides: {
		key?: string;
		categoryId?: string;
		amount: number;
		operationType?: OperationTypes;
	}): Pick<IPaymentOperationModel, 'amount' | 'categoryId' | 'operationType'> {
		return {
			amount: overrides.amount,
			categoryId: Guid.parse(overrides.categoryId ?? '850935c3-1e14-448f-be1c-30ef6f088fb5'),
			operationType: overrides.operationType ?? OperationTypes.Payment,
		};
	}
});
