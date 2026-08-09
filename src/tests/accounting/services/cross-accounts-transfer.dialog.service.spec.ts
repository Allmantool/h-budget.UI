import { TestBed } from '@angular/core/testing';
import { MatDialogConfig } from '@angular/material/dialog';

import { of } from 'rxjs';
import { Guid } from 'typescript-guid';

import { DialogContainer } from '../../../app/modules/shared/models/dialog-container';
import { DialogProvider } from '../../../app/modules/shared/providers/dialog-provider';
import { Result } from '../../../core/result';
import { CrossAccountsTransferProvider } from '../../../data/providers/accounting/cross-accounts-transfer.provider';
import { ICrossAccountsTransferModel } from '../../../domain/models/accounting/cross-accounts-transfer.model';
import { ICrossAccountsTransferResponse } from '../../../domain/models/accounting/responses/cross-accounts-transfer.response';
import { CrossAccountsTransferService } from '../../../presentation/accounting/services/cross-accounts-transfer.dialog.service';
import { TransferProjectionSynchronizationService } from '../../../presentation/accounting/services/transfer-projection-synchronization.service';

describe('cross accounts transfer service', () => {
	const sourceAccountId = Guid.parse('ad8ec3b4-4fa8-4112-80a8-dac1279c4a85');
	const targetAccountId = Guid.parse('c596f11b-d44d-425f-8c90-0655c51318ad');

	let sut: CrossAccountsTransferService;
	let dialogProviderSpy: jasmine.SpyObj<DialogProvider>;
	let transferProjectionSynchronizationService: TransferProjectionSynchronizationService;

	beforeEach(() => {
		dialogProviderSpy = jasmine.createSpyObj<DialogProvider>('dialogProvider', ['openDialog']);

		TestBed.configureTestingModule({
			providers: [
				CrossAccountsTransferService,
				TransferProjectionSynchronizationService,
				{
					provide: CrossAccountsTransferProvider,
					useValue: jasmine.createSpyObj<CrossAccountsTransferProvider>('transferProvider', {
						applyTransfer: of(
							new Result<ICrossAccountsTransferResponse>({
								isSucceeded: true,
								payload: {
									paymentAccountIds: [sourceAccountId, targetAccountId],
									paymentOperationId: Guid.create(),
								},
							})
						),
					}),
				},
				{ provide: DialogProvider, useValue: dialogProviderSpy },
			],
		});

		sut = TestBed.inject(CrossAccountsTransferService);
		transferProjectionSynchronizationService = TestBed.inject(TransferProjectionSynchronizationService);
	});

	it('starts synchronization immediately after a confirmed successful transfer response', () => {
		sut.openForTransfer();

		const config = dialogProviderSpy.openDialog.calls.mostRecent().args[1] as MatDialogConfig<
			DialogContainer<ICrossAccountsTransferModel, Result<ICrossAccountsTransferResponse>>
		>;
		const onSubmit = config.data?.onSubmit;

		if (!onSubmit) {
			fail('Expected transfer dialog configuration to provide an onSubmit callback.');
			return;
		}

		onSubmit({
			sender: sourceAccountId,
			recipient: targetAccountId,
			amount: 1,
			multiplier: 1,
			operationAt: new Date(2024, 4, 7),
		}).subscribe();

		expect(transferProjectionSynchronizationService.isSynchronizing(sourceAccountId)).toBeTrue();
		expect(transferProjectionSynchronizationService.isSynchronizing(targetAccountId)).toBeTrue();
	});
});
