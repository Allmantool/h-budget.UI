import { TestBed } from '@angular/core/testing';

import { PendingPaymentCommandRegistryService } from '../../../presentation/accounting/services/pending-payment-command-registry.service';

describe('pending payment command registry service', () => {
	let registry: PendingPaymentCommandRegistryService;

	beforeEach(() => {
		TestBed.configureTestingModule({ providers: [PendingPaymentCommandRegistryService] });
		registry = TestBed.inject(PendingPaymentCommandRegistryService);
		registry.clear();
	});

	afterEach(() => registry.clear());

	it('persists independent replayable commands without exposing storage details to callers', () => {
		registry.save(createPendingCommand('intent-one', 'key-one'));
		registry.save(createPendingCommand('intent-two', 'key-two'));

		expect(registry.getAll().map(command => command.intentId)).toEqual(['intent-one', 'intent-two']);

		registry.remove('intent-one');
		expect(registry.getAll().map(command => command.intentId)).toEqual(['intent-two']);
	});

	it('removes expired, corrupt, unsupported, and incomplete records without throwing', () => {
		registry.save({
			...createPendingCommand('expired', 'key-expired'),
			createdAt: new Date(Date.now() - 61 * 60 * 1_000).toISOString(),
		});
		registry.save({ ...createPendingCommand('unsupported', 'key-version'), version: 999 });
		registry.save({ ...createPendingCommand('incomplete', 'key-incomplete'), accountId: '' });

		expect(() => registry.getAll()).not.toThrow();
		expect(registry.getAll()).toEqual([]);
	});

	it('discards corrupted session storage JSON without preventing feature initialization', () => {
		sessionStorage.setItem('home-ledger.payment-commands.pending.v1', '{not-json');

		expect(() => registry.getAll()).not.toThrow();
		expect(registry.getAll()).toEqual([]);
		expect(sessionStorage.getItem('home-ledger.payment-commands.pending.v1')).toBeNull();
	});

	function createPendingCommand(intentId: string, idempotencyKey: string) {
		return {
			version: 1,
			intentId,
			action: 'create' as const,
			accountId: '1c12ec59-8875-45c1-9fb0-e4edcf34a074',
			idempotencyKey,
			request: {
				amount: 10,
				categoryId: '44444444-4444-4444-4444-444444444444',
				comment: 'Rent',
				contractorId: '00000000-0000-0000-0000-000000000000',
				operationDate: '2026-01-01T00:00:00.000Z',
				operationId: '00000000-0000-0000-0000-000000000000',
				operationType: 1,
			},
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		};
	}
});
