import { PaymentCommandIntent } from './payment-command-intent';

export interface PaymentCommandExecutionResult {
	commandId?: string;
	intent?: PaymentCommandIntent;
	message?: string;
	paymentOperationId?: string;
	status: 'projected' | 'failed' | 'unknown' | 'conflict';
}
