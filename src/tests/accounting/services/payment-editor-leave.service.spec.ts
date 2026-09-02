import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';

import { Subject } from 'rxjs';

import { PaymentEditorLeaveService } from '../../../presentation/accounting/services/payment-editor-leave.service';

describe('payment editor leave service', () => {
	let service: PaymentEditorLeaveService;
	let dialogOpenSpy: jasmine.Spy;

	beforeEach(() => {
		dialogOpenSpy = jasmine.createSpy('open');

		TestBed.configureTestingModule({
			providers: [PaymentEditorLeaveService, { provide: MatDialog, useValue: { open: dialogOpenSpy } }],
		});
		service = TestBed.inject(PaymentEditorLeaveService);
	});

	it('allows navigation when no editor is registered', async () => {
		await expectAsync(service.canLeave()).toBeResolvedTo(true);
	});

	it('delegates navigation decisions to the registered editor until it unregisters', async () => {
		const unregister = service.register(() => Promise.resolve(false));

		await expectAsync(service.canLeave()).toBeResolvedTo(false);
		unregister();
		await expectAsync(service.canLeave()).toBeResolvedTo(true);
	});

	it('shares an in-flight confirmation and returns false when the dialog is cancelled', async () => {
		const closed$ = new Subject<boolean | undefined>();
		dialogOpenSpy.and.returnValue({ afterClosed: () => closed$.asObservable() });

		const firstConfirmation = service.confirmDiscard();
		const secondConfirmation = service.confirmDiscard();
		expect(dialogOpenSpy).toHaveBeenCalledTimes(1);

		closed$.next(undefined);
		closed$.complete();

		await expectAsync(firstConfirmation).toBeResolvedTo(false);
		await expectAsync(secondConfirmation).toBeResolvedTo(false);
	});

	it('returns true only when the dialog explicitly confirms discard', async () => {
		const closed$ = new Subject<boolean | undefined>();
		dialogOpenSpy.and.returnValue({ afterClosed: () => closed$.asObservable() });

		const confirmation = service.confirmDiscard();
		closed$.next(true);
		closed$.complete();

		await expectAsync(confirmation).toBeResolvedTo(true);
	});
});
