import { HttpClient } from '@angular/common/http';

import { Observable, retry, take } from 'rxjs';
import { Guid } from 'typescript-guid';

import { AppConfigurationService } from '../../../app/modules/shared/services/app-configuration.service';
import { Result } from '../../../core/result';
import { ICrossAccountsTransferModel } from '../../../domain/models/accounting/cross-accounts-transfer.model';
import { ICrossAccountsTransferRequest } from '../../../domain/models/accounting/requests/cross-accounts-transfer.request';
import { ICrossAccountsTransferProvider } from '../../../domain/providers/accounting/cross-accounts-transfer.provider';

export class CrossAccountsTransferProvider implements ICrossAccountsTransferProvider {
	private accountingHostUrl?: string;

	constructor(
		private readonly http: HttpClient,

		private readonly appConfigurationService: AppConfigurationService
	) {
		this.accountingHostUrl = this.appConfigurationService.settings?.accountingHost;
	}

	public applyTransfer(payload: ICrossAccountsTransferModel): Observable<Result<Guid>> {
		const request: ICrossAccountsTransferRequest = {
			sender: payload.sender,
			recipient: payload.recipient,
			multiplier: payload.multiplier,
			amount: payload.amount,
			operationAt: payload.operationAt,
		};

		return this.http
			.post<Result<Guid>>(`${this.accountingHostUrl}/cross-accounts-transfer`, request)
			.pipe(retry(3), take(1));
	}
}
