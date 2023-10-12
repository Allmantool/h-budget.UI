import { Injectable } from '@angular/core';
import { MatDialogConfig } from '@angular/material/dialog';

import { Store } from '@ngxs/store';
import { of } from 'rxjs';
import * as _ from 'lodash';

import { DialogProvider } from '../../../app/modules/shared/providers/dialog-provider';
import { DialogContainer } from '../../../app/modules/shared/models/dialog-container';
import { Result } from '../../../core/result';
import { AddCounterParty } from '../../../app/modules/shared/store/states/handbooks/actions/counterparty.actions';
import { CounterpartiesDialogComponent } from '../../../app/modules/shared/components/dialog/counterparties/counterparties-dialog.component';

@Injectable()
export class CounterpartiesDialogService {
	constructor(
		private dialogProvider: DialogProvider,
		private store: Store
	) {}

	public openCategories(): void {
		const config = new MatDialogConfig<DialogContainer>();

		const onSave = (operationResult: Result<string>) => {
			if (!operationResult.isSucceeded) {
				return;
			}

			this.store.dispatch(new AddCounterParty(operationResult.payload));

			return of(operationResult.payload);
		};

		config.data = {
			title: 'Counter parties:',
			onSubmit: onSave,
		} as DialogContainer;

		config.disableClose = true;

		this.dialogProvider.openDialog(CounterpartiesDialogComponent, config);
	}
}
