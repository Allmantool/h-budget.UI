import { PaymentCommandStatus } from '../payment-command-status';

export interface IPaymentCommandResponse {
	commandId: string;
	isDuplicate: boolean;
	status: PaymentCommandStatus;
}
