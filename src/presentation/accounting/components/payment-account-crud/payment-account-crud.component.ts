import { StepperOrientation } from '@angular/cdk/stepper';
import { ChangeDetectionStrategy, Component, OnDestroy } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { BreakpointObserver } from '@angular/cdk/layout';

import { Observable, Subject } from 'rxjs';

@Component({
	selector: 'payment-account-crud',
	templateUrl: './payment-account-crud.component.html',
	styleUrls: ['./payment-account-crud.component.css'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentAccountCrudComponent implements OnDestroy {
	private destroy$ = new Subject<void>();

	public ngOnDestroy(): void {
		this.destroy$.next();
		this.destroy$.complete();
	}
}
