export class SelectDropdownOptions {
	constructor(options: Partial<SelectDropdownOptions>) {
		this.value = options.value;
		this.description = options.description;
	}

	value?: string;

	description?: string;
}
