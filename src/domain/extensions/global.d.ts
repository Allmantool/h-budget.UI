/* eslint-disable @typescript-eslint/no-unused-vars */
export {};

declare global {
	interface String {
		parseToTreeAsString(): string;
	}

	interface Array<T> {
		parseToTreeAsString(): string;
	}
}
