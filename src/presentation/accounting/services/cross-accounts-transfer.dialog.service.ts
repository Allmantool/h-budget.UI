import { Injectable } from '@angular/core';
import { MatDialogConfig } from '@angular/material/dialog';

import { of } from 'rxjs';

import { CrossAccountsTransferDialogComponent } from '../../../app/modules/shared/components/dialog/cross-accounts-transfer/cross-accounts-transfer-dialog.component';
import { DialogContainer } from '../../../app/modules/shared/models/dialog-container';
import { DialogProvider } from '../../../app/modules/shared/providers/dialog-provider';
import { Result } from '../../../core/result';
import { IPaymentAccountModel } from '../../../domain/models/accounting/payment-account.model';

@Injectable()
export class CrossAccountsTransferService {
	constructor(private readonly dialogProvider: DialogProvider) {}

	public openForTransfer(): void {
		const config = new MatDialogConfig<DialogContainer<IPaymentAccountModel[], Result<IPaymentAccountModel[]>>>();

		const onSave = (accountTransfer: IPaymentAccountModel[]) => {
			return of({} as Result<IPaymentAccountModel[]>);
		};

		config.data = {
			title: 'Cross accounts money transfer',
			onSubmit: onSave,
		};

		config.disableClose = true;

		this.dialogProvider.openDialog(CrossAccountsTransferDialogComponent, config);
	}
}
