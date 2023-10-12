export {};

String.prototype.parseToTreeAsString = function () {
	return (JSON.parse(this.toString()) as string[]).join(': ');
};
