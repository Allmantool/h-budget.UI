import { IPaymentCommandResponse } from './payment-command.response';

export interface IPaymentAccountCreateOrUpdateResponse extends IPaymentCommandResponse {
	paymentAccountId: string;
	paymentAccountBalance: number;
	paymentOperationId: string;
}
