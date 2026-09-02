import { inject } from '@angular/core';
import { CanDeactivateFn } from '@angular/router';

import { PaymentEditorLeaveService } from '../services/payment-editor-leave.service';

export const paymentEditorCanDeactivateGuard: CanDeactivateFn<unknown> = () =>
	inject(PaymentEditorLeaveService).canLeave();
