import { Guid } from 'typescript-guid';

import { ICategoryModel } from './category.model';
import { PaymentOperationTypes } from './operation-types';
import { IPaymentOperationModel } from './payment-operation.model';
import { OperationTypes } from '../../types/operation.types';

/**
 * Mirrors the accounting API balance increment contract for a single operation.
 */
export function calculatePaymentOperationIncrement(
	operation: Pick<IPaymentOperationModel, 'amount' | 'categoryId' | 'operationType'>,
	category?: Pick<ICategoryModel, 'operationType'>
): number {
	if (operation.operationType === OperationTypes.Transfer || operation.categoryId.equals(Guid.EMPTY)) {
		return operation.amount;
	}

	const magnitude = Math.abs(operation.amount);

	return category?.operationType === PaymentOperationTypes.Income ? magnitude : -magnitude;
}
