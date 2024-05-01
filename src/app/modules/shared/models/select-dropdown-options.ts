export class SelectDropdownOptions {
	constructor(options: Partial<SelectDropdownOptions>) {
		this.value = options.value;
		this.decription = options.decription;
	}

	value?: string;

	decription?: string;
}
