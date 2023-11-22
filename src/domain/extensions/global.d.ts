export {};

declare global {
	interface String {
		parseToTreeAsString(): string;
	}

	interface Array<T> {
		parseToTreeAsString(): string;
	}
}
