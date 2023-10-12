export {};

declare global {
	interface String {
		parseToTreeAsString(): string;
	}
}
