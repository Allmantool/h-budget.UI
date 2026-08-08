import { BreakpointObserver } from '@angular/cdk/layout';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatStepper, MatStepperModule } from '@angular/material/stepper';
import { Result } from 'core/result';

import * as _ from 'lodash';

import { Select, Store } from '@ngxs/store';
import { filter, map, Observable, take } from 'rxjs';

import { AccountTypes } from '../../../../../../domain/models/accounting/account-types';
import { IPaymentAccountModel } from '../../../../../../domain/models/accounting/payment-account.model';
import { CurrencyAbbreviations } from '../../../constants/rates-abbreviations';
import { DialogContainer } from '../../../models/dialog-container';
import { DialogOperationTypes } from '../../../models/dialog-operation-types';
import { SelectDropdownOptions } from '../../../models/select-dropdown-options';
import {
	AddPaymentAccount,
	UpdatePaymentAccount,
} from '../../../store/states/accounting/actions/payment-account.actions';
import {
	getActivePaymentAccountId,
	getPaymentAccounts,
} from '../../../store/states/accounting/selectors/payment-account.selector';
import { FormInput } from '../../../types/form-input.type';
import { AppFormFieldComponent } from '../../form-field/app-form-field.component';
import { ProgressBarComponent } from '../../progress-bar/progress-bar.component';

type PaymentAccountFormValue = FormInput | null;

type AccountDetailsFormControls = {
	accountTypeCtrl: FormControl<PaymentAccountFormValue>;
	currencyCtrl: FormControl<PaymentAccountFormValue>;
	balanceCtrl: FormControl<PaymentAccountFormValue>;
};

type AdditionalInfoFormControls = {
	descriptionCtrl: FormControl<PaymentAccountFormValue>;
	emitterCtrl: FormControl<PaymentAccountFormValue>;
};

const requiredPaymentAccountField: ValidatorFn = control => Validators.required(control);

@Component({
	selector: 'payment-account-dialog',
	templateUrl: './payment-account-dialog.component.html',
	styleUrls: ['./payment-account-dialog.component.css'],
	changeDetection: ChangeDetectionStrategy.OnPush,
	standalone: true,
	imports: [
		ReactiveFormsModule,
		MatButtonModule,
		MatDialogModule,
		MatDividerModule,
		MatIconModule,
		MatStepperModule,
		AppFormFieldComponent,
		ProgressBarComponent,
	],
})
export class PaymentAccountDialogComponent {
	private readonly store = inject(Store);
	private readonly dialogRef = inject(MatDialogRef<PaymentAccountDialogComponent>);
	private readonly breakpointObserver = inject(BreakpointObserver);
	private readonly dialogConfiguration =
		inject<DialogContainer<Result<IPaymentAccountModel>, Result<IPaymentAccountModel>>>(MAT_DIALOG_DATA);
	private readonly accountTypes = this.createAccountTypes();
	private readonly currencyTypes = this.createCurrencyTypes();
	public readonly isLoadingSignal = signal(false);
	public readonly selectedStepIndexSignal = signal(0);
	public readonly stepperOrientationSignal = toSignal(
		this.breakpointObserver
			.observe('(max-width: 599px)')
			.pipe(map(state => (state.matches ? 'vertical' : 'horizontal'))),
		{ initialValue: 'horizontal' }
	);
	public readonly accountDetailsStepFg = new FormGroup<AccountDetailsFormControls>({
		accountTypeCtrl: new FormControl<PaymentAccountFormValue>(
			this.accountTypes[0]?.value ?? null,
			requiredPaymentAccountField
		),
		currencyCtrl: new FormControl<PaymentAccountFormValue>(
			this.currencyTypes[0]?.value ?? null,
			requiredPaymentAccountField
		),
		balanceCtrl: new FormControl<PaymentAccountFormValue>(0, requiredPaymentAccountField),
	});
	public readonly additionalInfoStepFg = new FormGroup<AdditionalInfoFormControls>({
		descriptionCtrl: new FormControl<PaymentAccountFormValue>(''),
		emitterCtrl: new FormControl<PaymentAccountFormValue>(''),
	});
	public readonly accountTypeSignal = toSignal(this.accountDetailsStepFg.controls.accountTypeCtrl.valueChanges, {
		initialValue: this.accountDetailsStepFg.controls.accountTypeCtrl.value,
	});
	public readonly currencySignal = toSignal(this.accountDetailsStepFg.controls.currencyCtrl.valueChanges, {
		initialValue: this.accountDetailsStepFg.controls.currencyCtrl.value,
	});
	public readonly balanceSignal = toSignal(this.accountDetailsStepFg.controls.balanceCtrl.valueChanges, {
		initialValue: this.accountDetailsStepFg.controls.balanceCtrl.value,
	});
	public readonly emitterSignal = toSignal(this.additionalInfoStepFg.controls.emitterCtrl.valueChanges, {
		initialValue: this.additionalInfoStepFg.controls.emitterCtrl.value,
	});
	public readonly descriptionSignal = toSignal(this.additionalInfoStepFg.controls.descriptionCtrl.valueChanges, {
		initialValue: this.additionalInfoStepFg.controls.descriptionCtrl.value,
	});
	public readonly accountTypeDescriptionSignal = computed(() =>
		this.getOptionDescription(this.accountTypeSignal(), this.accountTypes)
	);
	public readonly currencyDescriptionSignal = computed(() =>
		this.getOptionDescription(this.currencySignal(), this.currencyTypes)
	);
	public readonly additionalInfoSignal = computed(() => this.getAdditionalInfo());
	public readonly title = this.dialogConfiguration.title;

	@Select(getPaymentAccounts)
	private paymentAccounts$!: Observable<IPaymentAccountModel[]>;

	@Select(getActivePaymentAccountId)
	private paymentAccountId$!: Observable<string>;

	constructor() {
		this.paymentAccountId$
			.pipe(
				takeUntilDestroyed(),
				filter(() => this.dialogConfiguration.operationType === DialogOperationTypes.Update)
			)
			.subscribe(accountId => this.populateAccountForUpdate(accountId));
	}

	public close(): void {
		this.dialogRef.close();
	}

	public getAccountsTypes(): SelectDropdownOptions[] {
		return this.accountTypes;
	}

	public getCurrencyTypes(): SelectDropdownOptions[] {
		return this.currencyTypes;
	}

	public next(stepper: MatStepper): void {
		if (stepper.selectedIndex === 0 && this.accountDetailsStepFg.invalid) {
			this.accountDetailsStepFg.markAllAsTouched();
			return;
		}

		stepper.next();
	}

	public previous(stepper: MatStepper): void {
		stepper.previous();
	}

	public editStep(stepper: MatStepper, stepIndex: number): void {
		stepper.selectedIndex = stepIndex;
	}

	public applyChanges(): void {
		if (this.isLoadingSignal() || this.accountDetailsStepFg.invalid) {
			this.accountDetailsStepFg.markAllAsTouched();
			return;
		}

		const accountType = this.getOptionValue(this.accountTypeSignal());
		const currency = this.getOptionValue(this.currencySignal());

		if (_.isNil(accountType) || _.isNil(currency)) {
			return;
		}

		this.isLoadingSignal.set(true);
		this.dialogConfiguration
			.onSubmit(
				new Result<IPaymentAccountModel>({
					payload: {
						type: AccountTypes[accountType as keyof typeof AccountTypes],
						currency,
						balance: this.getBalanceValue(this.balanceSignal()),
						emitter: this.getTextValue(this.emitterSignal()),
						description: this.getTextValue(this.descriptionSignal()),
					},
					isSucceeded: true,
				})
			)
			.pipe(take(1))
			.subscribe({
				next: response => this.completeSubmission(response),
				error: () => this.isLoadingSignal.set(false),
				complete: () => this.isLoadingSignal.set(false),
			});
	}

	public isUpdateMode(): boolean {
		return this.dialogConfiguration.operationType === DialogOperationTypes.Update;
	}

	private completeSubmission(response: Result<IPaymentAccountModel>): void {
		if (!response.isSucceeded) {
			return;
		}

		if (this.isUpdateMode()) {
			this.store.dispatch(new UpdatePaymentAccount(response.payload));
		} else {
			this.store.dispatch(new AddPaymentAccount(response.payload));
		}

		this.dialogRef.close();
	}

	private populateAccountForUpdate(accountId: string): void {
		const paymentAccount = this.store
			.selectSnapshot(getPaymentAccounts)
			.find(account => account.key?.toString() === accountId);

		if (_.isNil(paymentAccount)) {
			return;
		}

		this.accountDetailsStepFg.patchValue({
			accountTypeCtrl: this.accountTypes[paymentAccount.type],
			currencyCtrl: paymentAccount.currency,
			balanceCtrl: paymentAccount.balance,
		});
		this.additionalInfoStepFg.patchValue({
			emitterCtrl: paymentAccount.emitter,
			descriptionCtrl: paymentAccount.description,
		});
	}

	private createAccountTypes(): SelectDropdownOptions[] {
		return Object.keys(AccountTypes)
			.filter(type => isNaN(Number(type)))
			.map(type => new SelectDropdownOptions({ description: this.toAccountTypeLabel(type), value: type }));
	}

	private createCurrencyTypes(): SelectDropdownOptions[] {
		return Object.keys(CurrencyAbbreviations)
			.filter(abbreviation => isNaN(Number(abbreviation)))
			.map(
				abbreviation =>
					new SelectDropdownOptions({ description: this.toCurrencyLabel(abbreviation), value: abbreviation })
			);
	}

	private getAdditionalInfo(): string {
		const emitter = this.getTextValue(this.emitterSignal());
		const description = this.getTextValue(this.descriptionSignal());

		if (_.isEmpty(emitter) && _.isEmpty(description)) {
			return 'Not provided';
		}

		return _.compact([emitter, description]).join(' | ');
	}

	private getOptionDescription(value: PaymentAccountFormValue, options: SelectDropdownOptions[]): string {
		const optionValue = this.getOptionValue(value);
		return options.find(option => option.value === optionValue)?.description ?? '';
	}

	public getOptionValue(value: PaymentAccountFormValue): string | undefined {
		return value instanceof SelectDropdownOptions ? value.value : typeof value === 'string' ? value : undefined;
	}

	private getBalanceValue(value: PaymentAccountFormValue): number {
		const numericValue = typeof value === 'number' ? value : Number(value);

		return Number.isFinite(numericValue) ? numericValue : 0;
	}

	private getTextValue(value: PaymentAccountFormValue): string {
		return typeof value === 'string' ? value : '';
	}

	private toAccountTypeLabel(type: string): string {
		return type === 'WalletCache' ? 'Wallet / cash' : type;
	}

	private toCurrencyLabel(abbreviation: string): string {
		const currencyNames: Record<string, string> = {
			USD: 'US Dollar',
			BYN: 'Belarusian ruble',
			EUR: 'Euro',
			PLN: 'Polish zloty',
			TRY: 'Turkish lira',
		};
		return `${abbreviation} — ${currencyNames[abbreviation] ?? abbreviation}`;
	}
}
