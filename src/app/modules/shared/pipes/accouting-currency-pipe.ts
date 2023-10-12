import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
	name: 'accountingCurrencyFormat',
})
export class AccountingCurrencyFormatPipe implements PipeTransform {
	public transform(value: number, args?: any): string {
		return value == 0 ? '' : value?.toString();
	}
}
