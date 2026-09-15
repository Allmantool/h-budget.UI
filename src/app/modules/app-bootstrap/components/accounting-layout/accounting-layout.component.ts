import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterOutlet } from '@angular/router';

import * as _ from 'lodash';

import { Select } from '@ngxs/store';
import { BehaviorSubject, Observable } from 'rxjs';

import { ProgressSpinnerComponent } from '../../../shared/components/progress-spinner/progress-spinner.component';
import { requestsUnderProcessing } from '../../../shared/store/states/core/selectors/core-app.selectors';

@Component({
	selector: 'accounting-layout',
	templateUrl: './accounting-layout.component.html',
	styleUrls: ['./accounting-layout.component.css'],
	changeDetection: ChangeDetectionStrategy.OnPush,
	standalone: true,
	imports: [AsyncPipe, RouterOutlet, ProgressSpinnerComponent],
})
export class AccountingLayoutComponent implements OnInit {
	private readonly destroyRef = inject(DestroyRef);

	@Select(requestsUnderProcessing)
	requestsUnderProcessing$!: Observable<string[]>;

	public isDataLoading$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
	public isDetailOpen = false;

	public ngOnInit(): void {
		this.requestsUnderProcessing$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(requestIds => {
			if (_.isEmpty(requestIds)) {
				this.isDataLoading$.next(false);
				return;
			}

			this.isDataLoading$.next(true);
		});
	}

	public openDetail(): void {
		this.isDetailOpen = true;
	}

	public closeDetail(): void {
		this.isDetailOpen = false;
	}
}
