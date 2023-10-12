import { Injectable } from '@angular/core';
import { MatDialogConfig } from '@angular/material/dialog';

import { take, Subject } from 'rxjs';
import { Store } from '@ngxs/store';

import * as _ from 'lodash';

import { NationalBankCurrencyProvider } from 'data/providers/rates/national-bank-currency.provider';
import { DaysRangePayload } from 'domain/models/dates-range-payload.model';
import { DialogContainer } from 'app/modules/shared/models/dialog-container';
import { DateRangeDialogComponent } from 'app/modules/shared/components/dialog/dates-rage/dates-range-dialog.component';
import { DialogProvider } from 'app/modules/shared/providers/dialog-provider';
import { AddCurrencyGroups } from '../../../app/modules/shared/store/states/rates/actions/currency.actions';

@Injectable()
export class RatesDialogService {
	constructor(
		private dialogProvider: DialogProvider,
		private currencyRateProvider: NationalBankCurrencyProvider,
		private store: Store
	) {}

	public openLoadRatesForPeriod(): void {
		const config = new MatDialogConfig<DialogContainer>();

		const onGetRatesForPeriod = (payload: DaysRangePayload) => {
			if (_.isNil(payload)) {
				return;
			}

			const ratesAmountForPeriodSubject = new Subject<number>();

			this.currencyRateProvider
				.getCurrenciesForSpecifiedPeriod(payload)
				.pipe(take(1))
				.subscribe((rateGroups) => {
					this.store.dispatch(new AddCurrencyGroups(rateGroups));

					ratesAmountForPeriodSubject.next(rateGroups?.length);
				});

			return ratesAmountForPeriodSubject;
		};

		config.data = {
			title: 'Update rates for specify period:',
			onSubmit: onGetRatesForPeriod,
		} as DialogContainer;

		this.dialogProvider.openDialog(DateRangeDialogComponent, config);
	}
}
