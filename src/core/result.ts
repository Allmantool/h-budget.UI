export class Result<T> {
	constructor(result: Partial<Result<T>>) {
		this.isSucceeded = result.isSucceeded!;
		this.payload = result.payload!;
		this.message = result.message!;
	}

	message: string;
	payload: T;
	isSucceeded: boolean;
}
