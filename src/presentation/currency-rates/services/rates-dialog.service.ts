import { Injectable } from '@angular/core';
import { MatDialogConfig } from '@angular/material/dialog';

import * as _ from 'lodash';

import { Store } from '@ngxs/store';
import { Subject, take } from 'rxjs';

import { DateRangeDialogComponent } from '../../../app/modules/shared/components/dialog/dates-rage/dates-range-dialog.component';
import { DialogContainer } from '../../../app/modules/shared/models/dialog-container';
import { DialogProvider } from '../../../app/modules/shared/providers/dialog-provider';
import { AddCurrencyGroups } from '../../../app/modules/shared/store/states/rates/actions/currency.actions';
import { NationalBankCurrenciesProvider } from '../../../data/providers/rates/national-bank-currencies.provider';
import { DaysRangePayload } from '../../../domain/models/dates-range-payload.model';

@Injectable()
export class RatesDialogService {
	constructor(
		private dialogProvider: DialogProvider,
		private currencyRatesProvider: NationalBankCurrenciesProvider,
		private store: Store
	) {}

	public openLoadRatesForPeriod(): void {
		const config = new MatDialogConfig<DialogContainer>();

		config.data = {
			title: 'Update rates for specify period:',
			onSubmit: (payload: DaysRangePayload) => {
				if (_.isNil(payload)) {
					return;
				}

				const ratesAmountForPeriodSubject = new Subject<number>();

				this.currencyRatesProvider
					.getCurrenciesForSpecifiedPeriod(payload)
					.pipe(take(1))
					.subscribe(rateGroups => {
						this.store.dispatch(new AddCurrencyGroups(rateGroups));

						ratesAmountForPeriodSubject.next(rateGroups?.length);
					});

				return ratesAmountForPeriodSubject;
			},
		} as DialogContainer;

		this.dialogProvider.openDialog(DateRangeDialogComponent, config);
	}
}
