import { Injectable } from '@angular/core';
import { MatDialogConfig } from '@angular/material/dialog';

import * as _ from 'lodash';

import { concatMap, map } from 'rxjs';

import { CounterpartiesDialogComponent } from '../../../app/modules/shared/components/dialog/counterparties/counterparties-dialog.component';
import { DialogContainer } from '../../../app/modules/shared/models/dialog-container';
import { DialogProvider } from '../../../app/modules/shared/providers/dialog-provider';
import { DefaultContractorsProvider } from '../../../data/providers/accounting/contractors.provider';
import { ContractorModel } from '../../../domain/models/accounting/contractor.model.';

@Injectable()
export class CounterpartiesDialogService {
	constructor(
		private readonly contractorProvider: DefaultContractorsProvider,
		private readonly dialogProvider: DialogProvider
	) {}

	public openCategories(): void {
		const config = new MatDialogConfig<DialogContainer>();

		const onSave = (payloadForSave: ContractorModel) => {
			return this.contractorProvider.saveContractor(payloadForSave.nameNodes).pipe(
				map(responseResult => responseResult.payload),
				concatMap(contractorId => {
					return this.contractorProvider.getContractorById(contractorId);
				})
			);
		};

		config.data = {
			title: 'Counter parties:',
			onSubmit: onSave,
		} as DialogContainer;

		config.disableClose = true;

		this.dialogProvider.openDialog(CounterpartiesDialogComponent, config);
	}
}
