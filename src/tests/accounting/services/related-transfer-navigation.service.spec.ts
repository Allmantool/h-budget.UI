import { TestBed } from '@angular/core/testing';

import { NgxsModule, Store } from '@ngxs/store';
import { of } from 'rxjs';
import { Guid } from 'typescript-guid';

import { ngxsConfig } from '../../../app/modules/shared/store/ngxs.config';
import { AccountingOperationsTableState } from '../../../app/modules/shared/store/states/accounting/accounting-operations-table.state';
import { PaymentAccountState } from '../../../app/modules/shared/store/states/accounting/payment-account.state';
import { AccountingOperationsState } from '../../../app/modules/shared/store/states/accounting/payment-operations.state';
import { getActivePaymentAccountId } from '../../../app/modules/shared/store/states/accounting/selectors/payment-account.selector';
import { getSelectedRecordGuid } from '../../../app/modules/shared/store/states/accounting/selectors/table-options.selectors';
import { IPaymentRepresentationModel } from '../../../presentation/accounting/models/operation-record';
import { AccountsService } from '../../../presentation/accounting/services/accounts.service';
import { PaymentsHistoryService } from '../../../presentation/accounting/services/payments-history.service';
import { RelatedTransferNavigationService } from '../../../presentation/accounting/services/related-transfer-navigation.service';
import { TransferProjectionSynchronizationService } from '../../../presentation/accounting/services/transfer-projection-synchronization.service';

describe('related transfer navigation service', () => {
	let service: RelatedTransferNavigationService;
	let store: Store;
	let paymentsHistoryServiceSpy: jasmine.SpyObj<PaymentsHistoryService>;
	let accountsServiceSpy: jasmine.SpyObj<AccountsService>;
	let transferProjectionSynchronizationService: TransferProjectionSynchronizationService;

	const sourceOperationKey = Guid.parse('c5b43614-b2c7-41ed-9a35-5ae6c967cc1f');
	const relatedPaymentAccountId = Guid.parse('d4c1afcc-b4b3-4649-87f7-7fb5088fcffb');

	beforeEach(() => {
		paymentsHistoryServiceSpy = jasmine.createSpyObj<PaymentsHistoryService>('paymentsHistoryService', {
			refreshPaymentsHistory: of([]),
		});
		accountsServiceSpy = jasmine.createSpyObj<AccountsService>('accountsService', {
			refreshAccounts: of(undefined),
		});

		TestBed.configureTestingModule({
			imports: [
				NgxsModule.forRoot(
					[AccountingOperationsState, AccountingOperationsTableState, PaymentAccountState],
					ngxsConfig
				),
			],
			providers: [
				RelatedTransferNavigationService,
				TransferProjectionSynchronizationService,
				{ provide: PaymentsHistoryService, useValue: paymentsHistoryServiceSpy },
				{ provide: AccountsService, useValue: accountsServiceSpy },
			],
		});

		service = TestBed.inject(RelatedTransferNavigationService);
		store = TestBed.inject(Store);
		transferProjectionSynchronizationService = TestBed.inject(TransferProjectionSynchronizationService);
	});

	it('keeps the target pending until the rendered related operation has been focused', () => {
		const sourceRecord = createTransferRecord(sourceOperationKey, relatedPaymentAccountId);
		const relatedRecord = createTransferRecord(
			sourceOperationKey,
			Guid.parse('7ab412aa-d3c4-4710-9ecf-71d33b8300b5')
		);

		service.navigateToRelatedTransfer(sourceRecord).subscribe();

		expect(store.selectSnapshot(getActivePaymentAccountId)).toBe(relatedPaymentAccountId.toString());
		expect(paymentsHistoryServiceSpy.refreshPaymentsHistory.calls.mostRecent().args).toEqual([
			relatedPaymentAccountId,
		]);
		expect(accountsServiceSpy.refreshAccounts.calls.mostRecent().args).toEqual([relatedPaymentAccountId]);

		expect(service.getPendingTargetOperationKey(relatedPaymentAccountId)?.equals(sourceOperationKey)).toBeTrue();
		expect(store.selectSnapshot(getSelectedRecordGuid)).toBeUndefined();
		expect(transferProjectionSynchronizationService.isSynchronizing(relatedPaymentAccountId)).toBeFalse();
		expect(transferProjectionSynchronizationService.isDelayed(relatedPaymentAccountId)).toBeFalse();

		service.completePendingTarget(relatedPaymentAccountId, relatedRecord.key);

		expect(service.hasPendingTargetForAccount(relatedPaymentAccountId)).toBeFalse();
		expect(store.selectSnapshot(getSelectedRecordGuid)?.equals(sourceOperationKey)).toBeTrue();
	});

	it('keeps the target pending when authoritative history has not rendered the target row yet', () => {
		service
			.navigateToRelatedTransfer(createTransferRecord(sourceOperationKey, relatedPaymentAccountId))
			.subscribe();

		service.completePendingTarget(relatedPaymentAccountId, Guid.create());

		expect(service.hasPendingTargetForAccount(relatedPaymentAccountId)).toBeTrue();
		expect(store.selectSnapshot(getSelectedRecordGuid)).toBeUndefined();
	});

	it('replaces and consumes each pending target across repeated bidirectional navigation', () => {
		const firstRelatedAccountId = relatedPaymentAccountId;
		const secondRelatedAccountId = Guid.parse('7ab412aa-d3c4-4710-9ecf-71d33b8300b5');
		const firstRecord = createTransferRecord(sourceOperationKey, firstRelatedAccountId);
		const secondRecord = createTransferRecord(sourceOperationKey, secondRelatedAccountId);

		service.navigateToRelatedTransfer(firstRecord).subscribe();
		service.completePendingTarget(firstRelatedAccountId, sourceOperationKey);

		expect(service.hasPendingTargetForAccount(firstRelatedAccountId)).toBeFalse();

		service.navigateToRelatedTransfer(secondRecord).subscribe();
		service.completePendingTarget(secondRelatedAccountId, sourceOperationKey);

		expect(store.selectSnapshot(getActivePaymentAccountId)).toBe(secondRelatedAccountId.toString());
		expect(service.hasPendingTargetForAccount(secondRelatedAccountId)).toBeFalse();
		expect(store.selectSnapshot(getSelectedRecordGuid)?.equals(sourceOperationKey)).toBeTrue();
		expect(transferProjectionSynchronizationService.isSynchronizing(firstRelatedAccountId)).toBeFalse();
		expect(transferProjectionSynchronizationService.isSynchronizing(secondRelatedAccountId)).toBeFalse();
	});

	function createTransferRecord(operationKey: Guid, relatedAccountId: Guid): IPaymentRepresentationModel {
		return {
			key: operationKey,
			operationDate: new Date(2024, 0, 16),
			contractor: '',
			category: '',
			income: 0,
			expense: 13,
			comment: 'Transfer',
			balance: 0,
			operationType: 2,
			relatedPaymentAccountId: relatedAccountId,
		};
	}
});
