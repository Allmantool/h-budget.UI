import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { Guid } from 'typescript-guid';

import { AppConfigurationService } from '../../app/modules/shared/services/app-configuration.service';
import { CrossAccountsTransferProvider } from '../../data/providers/accounting/cross-accounts-transfer.provider';
import { ICrossAccountsTransferModel } from '../../domain/models/accounting/cross-accounts-transfer.model';
import { IAppSettingsModel } from '../../domain/models/app-settings.model';

describe('cross accounts transfer provider', () => {
	const gatewayHost = 'https://gateway.example.test';
	const transfer: ICrossAccountsTransferModel = {
		sender: Guid.parse('ad8ec3b4-4fa8-4112-80a8-dac1279c4a85'),
		recipient: Guid.parse('c596f11b-d44d-425f-8c90-0655c51318ad'),
		amount: 10,
		multiplier: 2.5,
		operationAt: new Date(2024, 0, 11),
	};

	let httpTestingController: HttpTestingController;
	let sut: CrossAccountsTransferProvider;
	const appSettings: IAppSettingsModel = { gatewayHost };

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [HttpClientTestingModule],
			providers: [
				CrossAccountsTransferProvider,
				{
					provide: AppConfigurationService,
					useValue: {
						settings: appSettings,
					},
				},
			],
		});

		httpTestingController = TestBed.inject(HttpTestingController);
		sut = TestBed.inject(CrossAccountsTransferProvider);
	});

	afterEach(() => {
		httpTestingController.verify();
	});

	it('submits the financial command once and does not retry a transport failure', () => {
		let receivedError: unknown;

		sut.applyTransfer(transfer).subscribe({
			error: (error: unknown) => {
				receivedError = error;
			},
		});

		const request = httpTestingController.expectOne(`${gatewayHost}/accounting/cross-accounts-transfer`);
		expect(request.request.method).toBe('POST');
		expect(request.request.body).toEqual({
			sender: transfer.sender.toString(),
			recipient: transfer.recipient.toString(),
			amount: transfer.amount,
			multiplier: transfer.multiplier,
			operationAt: '2024-01-11',
		});

		request.flush(null, { status: 500, statusText: 'Server Error' });

		expect(receivedError).toEqual(jasmine.objectContaining({ status: 500 }));
	});
});
