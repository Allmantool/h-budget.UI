import { ENTER } from '@angular/cdk/keycodes';
import { ChangeDetectionStrategy, Component, computed, Inject, signal, Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import _ from 'lodash';

import { Select } from '@ngxs/store';
import { Observable, take } from 'rxjs';

import { Result } from '../../../../../../core/result';
import { MoneyTransferDirections } from '../../../../../../domain/models/accounting/money-transfer-directions';
import { IPaymentAccountModel } from '../../../../../../domain/models/accounting/payment-account.model';
import { DialogContainer } from '../../../models/dialog-container';
import {
	getActivePaymentAccountId,
	getPaymentAccounts,
} from '../../../store/states/accounting/selectors/payment-account.selector';

@Component({
	selector: 'cross-accounts-transfer-dialog',
	templateUrl: './cross-accounts-transfer-dialog.component.html',
	styleUrls: ['./cross-accounts-transfer-dialog.component.css'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CrossAccountsTransferDialogComponent {
	private dialogConfiguration: DialogContainer<IPaymentAccountModel[], Result<IPaymentAccountModel[]>>;
	public isLoadingSignal = signal<boolean>(false);

	public readonly separatorKeysCodes: number[] = [ENTER];
	public isSaveDisabled: boolean = true;
	public title: string;
	public dialogFg: UntypedFormGroup;

	@Select(getPaymentAccounts)
	paymentAccounts$!: Observable<IPaymentAccountModel[]>;

	@Select(getActivePaymentAccountId)
	paymentAccountId$!: Observable<string>;

	public paymentAccountTitlesSignal: Signal<string[]>;
	public paymentAccountsSignal: Signal<IPaymentAccountModel[]>;
	public paymentAccountIdSignal: Signal<string>;

	constructor(
		private fb: UntypedFormBuilder,
		private dialogRef: MatDialogRef<CrossAccountsTransferDialogComponent>,
		@Inject(MAT_DIALOG_DATA)
		dialogConfiguration: DialogContainer<IPaymentAccountModel[], Result<IPaymentAccountModel[]>>
	) {
		this.title = dialogConfiguration.title;
		this.dialogConfiguration = dialogConfiguration;
		this.dialogFg = fb.group({
			categoryType: new UntypedFormControl(),
		});
		this.paymentAccountsSignal = toSignal(this.paymentAccounts$, { initialValue: [] });
		this.paymentAccountIdSignal = toSignal(this.paymentAccountId$, { initialValue: '' });

		this.paymentAccountTitlesSignal = computed(() =>
			_.chain(this.paymentAccountsSignal())
				.filter(acc => acc.key?.toString() !== this.paymentAccountIdSignal())
				.map(acc => `${acc.emitter} | ${acc.description}`)
				.value()
		);
	}

	public getTransferDirections(): string[] {
		return Object.keys(MoneyTransferDirections).filter(v => isNaN(Number(v)));
	}

	public close() {
		this.dialogRef.close();
	}

	public save(): void {
		this.isLoadingSignal.set(true);

		this.dialogConfiguration
			.onSubmit({} as IPaymentAccountModel[])
			.pipe(take(1))
			.subscribe(response => {
				this.isLoadingSignal.set(false);
				this.dialogRef.close();
			});
	}
}
