import { Injectable } from '@angular/core';
import { MatDialogConfig } from '@angular/material/dialog';

import { CrossAccountsTransferDialogComponent } from '../../../app/modules/shared/components/dialog/cross-accounts-transfer/cross-accounts-transfer-dialog.component';
import { DialogContainer } from '../../../app/modules/shared/models/dialog-container';
import { DialogProvider } from '../../../app/modules/shared/providers/dialog-provider';
import { Result } from '../../../core/result';
import { CrossAccountsTransferProvider } from '../../../data/providers/accounting/cross-accounts-transfer.provider';
import { ICrossAccountsTransferModel } from '../../../domain/models/accounting/cross-accounts-transfer.model';
import { ICrossAccountsTransferResponse } from '../../../domain/models/accounting/responses/cross-accounts-transfer.response';

@Injectable()
export class CrossAccountsTransferService {
	constructor(
		private readonly transferProvider: CrossAccountsTransferProvider,
		private readonly dialogProvider: DialogProvider
	) {}

	public openForTransfer(): void {
		const config = new MatDialogConfig<
			DialogContainer<ICrossAccountsTransferModel, Result<ICrossAccountsTransferResponse>>
		>();

		const onSave = (crossAccountsTransfer: ICrossAccountsTransferModel) => {
			return this.transferProvider.applyTransfer(crossAccountsTransfer);
		};

		config.data = {
			title: 'Transfer money',
			onSubmit: onSave,
		};

		config.disableClose = true;

		this.dialogProvider.openDialog(CrossAccountsTransferDialogComponent, config);
	}
}
