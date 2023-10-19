import { Guid } from 'typescript-guid';

import { AccountTypes } from './account-types';
import { CurrencyAbbrevitions } from '../../../app/modules/shared/constants/rates-abbreviations';

export interface PaymentAccountModel {
	id: Guid;
	type: AccountTypes;
	currency: CurrencyAbbrevitions;
	balance: number;
	emitter: string;
	description: string;
}
