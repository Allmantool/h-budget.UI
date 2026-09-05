interface ReplayablePaymentCommandRequest {
	amount: number;
	categoryId: string;
	comment: string;
	contractorId: string;
	operationDate: string;
	operationId: string;
	operationType: number;
}

export interface PendingPaymentCommand {
	accountId: string;
	action: 'create' | 'update' | 'delete';
	commandId?: string;
	createdAt: string;
	idempotencyKey: string;
	intentId: string;
	operationId?: string;
	request?: ReplayablePaymentCommandRequest;
	updatedAt: string;
	version: number;
}
