export interface PaymentCommandIntent {
	action: 'create' | 'update' | 'delete';
	accountId: string;
	idempotencyKey: string;
	intentId: string;
	requestFingerprint: string;
}
