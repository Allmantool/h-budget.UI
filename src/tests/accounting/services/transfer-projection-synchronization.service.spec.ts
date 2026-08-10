import { fakeAsync, TestBed, tick } from '@angular/core/testing';

import { Guid } from 'typescript-guid';

import { TransferProjectionSynchronizationService } from '../../../presentation/accounting/services/transfer-projection-synchronization.service';

describe('transfer projection synchronization service', () => {
	const sourceAccountId = Guid.parse('ad8ec3b4-4fa8-4112-80a8-dac1279c4a85');
	const targetAccountId = Guid.parse('c596f11b-d44d-425f-8c90-0655c51318ad');
	const transferOperationId = Guid.parse('38bb228c-9728-48fa-91d2-1d00f4979545');

	let sut: TransferProjectionSynchronizationService;

	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [TransferProjectionSynchronizationService],
		});

		sut = TestBed.inject(TransferProjectionSynchronizationService);
	});

	it('shows synchronization for every affected account until the submitted operation is projected', () => {
		sut.start([sourceAccountId, targetAccountId], transferOperationId);

		expect(sut.isSynchronizing(sourceAccountId)).toBeTrue();
		expect(sut.isSynchronizing(targetAccountId)).toBeTrue();

		sut.completeProjectedOperations(sourceAccountId, [Guid.create()]);

		expect(sut.isSynchronizing(sourceAccountId)).toBeTrue();

		sut.completeProjectedOperations(sourceAccountId, [transferOperationId]);

		expect(sut.isSynchronizing(sourceAccountId)).toBeFalse();
		expect(sut.isSynchronizing(targetAccountId)).toBeTrue();

		sut.completeProjectedOperations(targetAccountId, [transferOperationId]);
		expect(sut.isSynchronizing(targetAccountId)).toBeFalse();
	});

	it('changes to a non-busy delayed state if the authoritative refresh is lost', fakeAsync(() => {
		sut.start([sourceAccountId], transferOperationId);

		tick(30_000);

		expect(sut.isSynchronizing(sourceAccountId)).toBeFalse();
		expect(sut.isDelayed(sourceAccountId)).toBeTrue();
	}));

	it('clears a delayed synchronization when its operation is eventually projected', fakeAsync(() => {
		sut.start([sourceAccountId], transferOperationId);
		tick(30_000);

		sut.completeProjectedOperations(sourceAccountId, [transferOperationId]);

		expect(sut.isDelayed(sourceAccountId)).toBeFalse();
	}));
});
