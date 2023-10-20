import { Guid } from 'typescript-guid';

import { AccountTypes } from './account-types';

export interface PaymentAccountModel {
	id: Guid;
	type: AccountTypes;
	currency: string;
	balance: number;
	emitter: string;
	description: string;
}
