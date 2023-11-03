export class AddProcessingRequest {
	static readonly type = '[CORE-APP-STATE] Start tracking a request under processing by correlation id';
	constructor(public requestCorrelationId: string) {}
}

export class RemoveProcessingRequest {
	static readonly type = '[CORE-APP-STATE] Stop tracking a request under processing by correlation id';
	constructor(public requestCorrelationId: string) {}
}
