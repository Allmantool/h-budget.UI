import { Guid } from 'typescript-guid';

import {
	PaymentEditorSessionService,
	RECENT_PAYMENT_MUTATION_DURATION_MS,
} from '../../../presentation/accounting/services/payment-editor-session.service';

describe('payment editor session service', () => {
	let service: PaymentEditorSessionService;
	const operationId = Guid.parse('0a645003-60b0-40ba-aaf5-510662e53ee7');

	beforeEach(() => {
		service = new PaymentEditorSessionService();
	});

	afterEach(() => service.ngOnDestroy());

	it('keeps explicit create mode independent from a prior edit mode', () => {
		service.beginEdit();
		expect(service.editorModeSignal()).toBe('edit');

		service.beginCreate();

		expect(service.editorModeSignal()).toBe('create');
	});

	it('only exposes an added marker once its projected operation is visible and clears it deterministically', () => {
		jasmine.clock().install();
		try {
			service.queueRecentMutation(operationId, 'created');
			expect(service.recentMutationSignal()).toBeUndefined();

			service.confirmRecentMutationIsVisible([]);
			expect(service.recentMutationSignal()).toBeUndefined();

			service.confirmRecentMutationIsVisible([operationId]);
			expect(service.recentMutationSignal()).toEqual({ operationId, kind: 'created' });

			jasmine.clock().tick(RECENT_PAYMENT_MUTATION_DURATION_MS - 1);
			expect(service.recentMutationSignal()).toEqual({ operationId, kind: 'created' });

			jasmine.clock().tick(1);
			expect(service.recentMutationSignal()).toBeUndefined();
		} finally {
			jasmine.clock().uninstall();
		}
	});

	it('replaces a pending marker with the latest projected mutation', () => {
		const replacementId = Guid.parse('5a4ab9fd-3128-43b6-ab4d-47c55a25c7cf');
		service.queueRecentMutation(operationId, 'created');
		service.queueRecentMutation(replacementId, 'updated');

		service.confirmRecentMutationIsVisible([operationId, replacementId]);

		expect(service.recentMutationSignal()).toEqual({ operationId: replacementId, kind: 'updated' });
	});

	it('cleans timer-backed state when its route-scoped lifetime ends', () => {
		jasmine.clock().install();
		try {
			service.queueRecentMutation(operationId, 'created');
			service.confirmRecentMutationIsVisible([operationId]);

			service.ngOnDestroy();
			jasmine.clock().tick(RECENT_PAYMENT_MUTATION_DURATION_MS);

			expect(service.editorModeSignal()).toBe('create');
			expect(service.recentMutationSignal()).toBeUndefined();
		} finally {
			jasmine.clock().uninstall();
		}
	});
});
