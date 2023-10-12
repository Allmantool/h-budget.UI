import { Guid } from 'typescript-guid';

import { AccountTypes } from './account-types';
import { CurrencyAbbrevitions } from '../../../app/modules/shared/constants/rates-abbreviations';

export interface PaymentAccount {
	id: Guid;
	type: AccountTypes;
	balance: number;
	currency: CurrencyAbbrevitions;
	agent: string;
	description: string;
}
