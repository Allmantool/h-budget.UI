import { Injectable } from '@angular/core';
import { MatDialogConfig } from '@angular/material/dialog';

import * as _ from 'lodash';

import { concatMap, map } from 'rxjs';

import { ContractorsDialogComponent } from '../../../app/modules/shared/components/dialog/contractors/contractors-dialog.component';
import { DialogContainer } from '../../../app/modules/shared/models/dialog-container';
import { DialogProvider } from '../../../app/modules/shared/providers/dialog-provider';
import { DefaultContractorsProvider } from '../../../data/providers/accounting/contractors.provider';
import { IContractorModel } from '../../../domain/models/accounting/contractor.model.';

@Injectable()
export class ContractorsDialogService {
	constructor(
		private readonly contractorProvider: DefaultContractorsProvider,
		private readonly dialogProvider: DialogProvider
	) {}

	public openCategories(): void {
		const config = new MatDialogConfig<DialogContainer<IContractorModel, IContractorModel>>();

		const onSave = (payloadForSave: IContractorModel) => {
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
		} as DialogContainer<IContractorModel, IContractorModel>;

		config.disableClose = true;

		this.dialogProvider.openDialog(ContractorsDialogComponent, config);
	}
}
