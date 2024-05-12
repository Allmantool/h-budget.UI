import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { format } from 'date-fns';
import { Observable, retry, take } from 'rxjs';
import { Guid } from 'typescript-guid';

import { DateFormats } from '../../../app/modules/shared/constants/date-formats';
import { AppConfigurationService } from '../../../app/modules/shared/services/app-configuration.service';
import { Result } from '../../../core/result';
import { ICrossAccountsTransferModel } from '../../../domain/models/accounting/cross-accounts-transfer.model';
import { ICrossAccountsTransferRequest } from '../../../domain/models/accounting/requests/cross-accounts-transfer.request';
import { ICrossAccountsTransferProvider } from '../../../domain/providers/accounting/cross-accounts-transfer.provider';

@Injectable()
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
			sender: payload.sender.toString(),
			recipient: payload.recipient.toString(),
			multiplier: payload.multiplier,
			amount: +payload.amount,
			operationAt: format(payload.operationAt, DateFormats.ApiRequest),
		};

		return this.http
			.post<Result<Guid>>(`${this.accountingHostUrl}/cross-accounts-transfer`, request)
			.pipe(retry(3), take(1));
	}
}
