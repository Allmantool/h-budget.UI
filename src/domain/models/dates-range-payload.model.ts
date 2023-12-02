export class DaysRangePayload {
	constructor(payload: Partial<DaysRangePayload>) {
		this.startDate = payload.startDate!;
		this.endDate = payload.endDate!;
	}

	startDate: Date;
	endDate: Date;
}
