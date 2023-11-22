export {};

String.prototype.parseToTreeAsString = function () {
	return (JSON.parse(this.toString()) as string[]).join(': ');
};

Array.prototype.parseToTreeAsString = function () {
	return (this as string[]).join(': ');
};
