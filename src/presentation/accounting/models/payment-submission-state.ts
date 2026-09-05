export type PaymentSubmissionOperation = 'create' | 'update' | 'delete';

export type PaymentSubmissionState =
	| { status: 'idle' }
	| { status: 'submitting'; operation: PaymentSubmissionOperation }
	| { status: 'accepted'; operation: PaymentSubmissionOperation; operationId: string }
	| { status: 'waitingForProjection'; operation: PaymentSubmissionOperation; operationId: string }
	| { status: 'projectionDelayed'; operation: PaymentSubmissionOperation; operationId: string }
	| { status: 'uncertain'; operation: PaymentSubmissionOperation; message: string }
	| { status: 'succeeded'; operation: PaymentSubmissionOperation; operationId?: string }
	| { status: 'failed'; operation: PaymentSubmissionOperation; message: string };
