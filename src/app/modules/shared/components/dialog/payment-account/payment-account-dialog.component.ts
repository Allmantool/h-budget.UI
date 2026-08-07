import { BreakpointObserver } from '@angular/cdk/layout';
import { StepperOrientation } from '@angular/cdk/stepper';
import { ChangeDetectionStrategy, Component, computed, Inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
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
import { FormInput } from '../../../types/form-input.type';
import {
	AddPaymentAccount,
	UpdatePaymentAccount,
} from '../../../store/states/accounting/actions/payment-account.actions';
import {
	getActivePaymentAccountId,
	getPaymentAccounts,
} from '../../../store/states/accounting/selectors/payment-account.selector';
import { AppFormFieldComponent } from '../../form-field/app-form-field.component';
import { ProgressBarComponent } from '../../progress-bar/progress-bar.component';

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
	private readonly dialogConfiguration: DialogContainer<Result<IPaymentAccountModel>, Result<IPaymentAccountModel>>;
	private readonly accountTypes = this.createAccountTypes();
	private readonly currencyTypes = this.createCurrencyTypes();
	public readonly isLoadingSignal = signal(false);
	public readonly selectedStepIndexSignal = signal(0);
	public readonly stepperOrientationSignal = toSignal(
		this.breakpointObserver
			.observe('(max-width: 599px)')
			.pipe(map(state => (state.matches ? 'vertical' : 'horizontal') as StepperOrientation)),
		{ initialValue: 'horizontal' as StepperOrientation }
	);
	public readonly accountDetailsStepFg: UntypedFormGroup;
	public readonly additionalInfoStepFg = this.fb.group({
		descriptionCtrl: [''],
		emitterCtrl: [''],
	});
	public readonly accountTypeSignal;
	public readonly currencySignal;
	public readonly balanceSignal;
	public readonly emitterSignal;
	public readonly descriptionSignal;
	public readonly accountTypeDescriptionSignal = computed(() =>
		this.getOptionDescription(this.accountTypeSignal(), this.accountTypes)
	);
	public readonly currencyDescriptionSignal = computed(() =>
		this.getOptionDescription(this.currencySignal(), this.currencyTypes)
	);
	public readonly additionalInfoSignal = computed(() => this.getAdditionalInfo());
	public readonly title: string;

	@Select(getPaymentAccounts)
	private paymentAccounts$!: Observable<IPaymentAccountModel[]>;

	@Select(getActivePaymentAccountId)
	private paymentAccountId$!: Observable<string>;

	constructor(
		private readonly store: Store,
		private readonly dialogRef: MatDialogRef<PaymentAccountDialogComponent>,
		private readonly fb: UntypedFormBuilder,
		private readonly breakpointObserver: BreakpointObserver,
		@Inject(MAT_DIALOG_DATA)
		dialogConfiguration: DialogContainer<Result<IPaymentAccountModel>, Result<IPaymentAccountModel>>
	) {
		this.title = dialogConfiguration.title;
		this.dialogConfiguration = dialogConfiguration;

		this.accountDetailsStepFg = this.fb.group({
			accountTypeCtrl: [this.accountTypes[0].value, Validators.required],
			currencyCtrl: [this.currencyTypes[0].value, Validators.required],
			balanceCtrl: [0, Validators.required],
		});

		this.accountTypeSignal = toSignal(this.accountDetailsStepFg.controls.accountTypeCtrl.valueChanges, {
			initialValue: this.accountDetailsStepFg.controls.accountTypeCtrl.value as FormInput,
		});
		this.currencySignal = toSignal(this.accountDetailsStepFg.controls.currencyCtrl.valueChanges, {
			initialValue: this.accountDetailsStepFg.controls.currencyCtrl.value as FormInput,
		});
		this.balanceSignal = toSignal(this.accountDetailsStepFg.controls.balanceCtrl.valueChanges, {
			initialValue: this.accountDetailsStepFg.controls.balanceCtrl.value as FormInput,
		});
		this.emitterSignal = toSignal(this.additionalInfoStepFg.controls.emitterCtrl.valueChanges, {
			initialValue: '',
		});
		this.descriptionSignal = toSignal(this.additionalInfoStepFg.controls.descriptionCtrl.valueChanges, {
			initialValue: '',
		});

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
						balance: this.balanceSignal() as number,
						emitter: this.emitterSignal(),
						description: this.descriptionSignal(),
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
		const emitter = this.emitterSignal();
		const description = this.descriptionSignal();

		if (_.isEmpty(emitter) && _.isEmpty(description)) {
			return 'Not provided';
		}

		return _.compact([emitter, description]).join(' | ');
	}

	private getOptionDescription(value: FormInput, options: SelectDropdownOptions[]): string {
		const optionValue = this.getOptionValue(value);
		return options.find(option => option.value === optionValue)?.description ?? '';
	}

	public getOptionValue(value: FormInput): string | undefined {
		return value instanceof SelectDropdownOptions ? value.value : typeof value === 'string' ? value : undefined;
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
