import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { Select, Store } from '@ngxs/store';
import { combineLatest, firstValueFrom, Observable } from 'rxjs';
import { Guid } from 'typescript-guid';

import { SetActiveAccountingOperation } from '../../../../app/modules/shared/store/states/accounting/actions/accounting-table-options.actions';
import { getAccountPayments } from '../../../../app/modules/shared/store/states/accounting/selectors/accounting.selectors';
import {
	getActivePaymentAccount,
	getActivePaymentAccountId,
} from '../../../../app/modules/shared/store/states/accounting/selectors/payment-account.selector';
import { getSelectedRecordGuid } from '../../../../app/modules/shared/store/states/accounting/selectors/table-options.selectors';
import { getCategories } from '../../../../app/modules/shared/store/states/handbooks/selectors/categories.selectors';
import { getContractors } from '../../../../app/modules/shared/store/states/handbooks/selectors/counterparties.selectors';
import { ICategoryModel } from '../../../../domain/models/accounting/category.model';
import { IContractorModel } from '../../../../domain/models/accounting/contractor.model.';
import { PaymentOperationTypes } from '../../../../domain/models/accounting/operation-types';
import { IPaymentAccountModel } from '../../../../domain/models/accounting/payment-account.model';
import { IPaymentOperationModel } from '../../../../domain/models/accounting/payment-operation.model';
import { OperationTypes } from '../../../../domain/types/operation.types';
import { PaymentCommandExecutionResult } from '../../models/payment-command-execution-result';
import { PaymentCommandIntent } from '../../models/payment-command-intent';
import { PaymentSubmissionState } from '../../models/payment-submission-state';
import { CategoriesDialogService } from '../../services/categories-dialog.service';
import { ContractorsDialogService } from '../../services/contractors-dialog.service';
import { PaymentCommandExecutorService } from '../../services/payment-command-executor.service';
import { PaymentEditorLeaveService } from '../../services/payment-editor-leave.service';
import { PaymentEditorSessionService } from '../../services/payment-editor-session.service';
import { PaymentDeleteDialogComponent } from '../payment-delete-dialog/payment-delete-dialog.component';

interface PaymentEditorValue {
	amount: number;
	categoryId: string;
	comment: string;
	contractorId: string;
	direction: PaymentOperationTypes;
	operationDate: Date;
}

interface NormalizedPaymentEditorValue {
	amount: number | string;
	categoryId: string;
	comment: string;
	contractorId: string;
	direction: PaymentOperationTypes;
	operationDate: string;
}

interface PaymentDeleteDialogData {
	amount: number;
	category: string;
	currency: string;
	date: string;
	payee: string;
}

@Component({
	selector: 'accounting-crud',
	templateUrl: './accounting-operations-crud.component.html',
	styleUrls: ['./accounting-operations-crud.component.css'],
	changeDetection: ChangeDetectionStrategy.OnPush,
	standalone: true,
	imports: [
		ReactiveFormsModule,
		MatButtonModule,
		MatDatepickerModule,
		MatDialogModule,
		MatFormFieldModule,
		MatIconModule,
		MatInputModule,
		MatNativeDateModule,
		MatSelectModule,
	],
})
export class AccountingOperationsCrudComponent implements OnInit {
	private readonly destroyRef = inject(DestroyRef);
	private readonly formBuilder = inject(FormBuilder);
	private readonly baselineSignal = signal<NormalizedPaymentEditorValue>(
		this.normalizeEditableValue(this.defaultValue())
	);
	private loadedOperationId?: string;
	private activeAccountId?: string;
	private executionToken = 0;
	private isDestroyed = false;
	private pendingIntent?: PaymentCommandIntent;

	@Select(getActivePaymentAccountId)
	private activePaymentAccountId$!: Observable<Guid | undefined>;

	@Select(getActivePaymentAccount)
	private activePaymentAccount$!: Observable<IPaymentAccountModel | undefined>;

	@Select(getAccountPayments)
	private paymentOperations$!: Observable<IPaymentOperationModel[]>;

	@Select(getSelectedRecordGuid)
	private selectedRecordGuid$!: Observable<Guid | undefined>;

	@Select(getCategories)
	private categories$!: Observable<ICategoryModel[]>;

	@Select(getContractors)
	private contractors$!: Observable<IContractorModel[]>;

	public readonly paymentForm = this.formBuilder.nonNullable.group({
		amount: [
			0,
			[
				(control: AbstractControl) => Validators.required(control),
				(control: AbstractControl) => Validators.min(0.01)(control),
			],
		],
		categoryId: ['', (control: AbstractControl) => Validators.required(control)],
		comment: [''],
		contractorId: [''],
		direction: [PaymentOperationTypes.Expense, (control: AbstractControl) => Validators.required(control)],
		operationDate: [this.businessDateToday(), (control: AbstractControl) => Validators.required(control)],
	});

	public readonly activeAccountSignal = toSignal(this.activePaymentAccount$, { initialValue: undefined });
	public readonly activeAccountIdSignal = toSignal(this.activePaymentAccountId$, { initialValue: undefined });
	public readonly categoriesSignal = toSignal(this.categories$, { initialValue: [] });
	public readonly contractorsSignal = toSignal(this.contractors$, { initialValue: [] });
	public readonly paymentOperationsSignal = toSignal(this.paymentOperations$, { initialValue: [] });
	public readonly selectedRecordGuidSignal = toSignal(this.selectedRecordGuid$, { initialValue: undefined });
	public readonly formValueSignal = toSignal(this.paymentForm.valueChanges, {
		initialValue: this.paymentForm.getRawValue(),
	});
	public readonly submissionStateSignal = signal<PaymentSubmissionState>({ status: 'idle' });
	public readonly editorModeSignal = this.paymentEditorSession.editorModeSignal;
	public readonly selectedOperationSignal = computed(() => {
		const selectedId = this.selectedRecordGuidSignal();
		return selectedId
			? this.paymentOperationsSignal().find(operation => operation.key.equals(selectedId))
			: undefined;
	});
	public readonly filteredCategoriesSignal = computed(() =>
		this.categoriesSignal().filter(category => category.operationType === this.formValueSignal().direction)
	);
	public readonly isSubmittingSignal = computed(() => {
		const status = this.submissionStateSignal().status;
		return status === 'submitting' || status === 'waitingForProjection';
	});
	public readonly isDirtySignal = computed(
		() => !this.areEquivalent(this.normalizeEditableValue(this.formValueSignal()), this.baselineSignal())
	);

	constructor(
		private readonly paymentCommandExecutor: PaymentCommandExecutorService,
		private readonly categoriesDialogService: CategoriesDialogService,
		private readonly contractorsDialogService: ContractorsDialogService,
		private readonly paymentEditorLeaveService: PaymentEditorLeaveService,
		private readonly paymentEditorSession: PaymentEditorSessionService,
		private readonly dialog: MatDialog,
		private readonly store: Store
	) {}

	public ngOnInit(): void {
		const unregisterLeaveEditor = this.paymentEditorLeaveService.register(() => this.canLeaveEditor());
		combineLatest([this.selectedRecordGuid$, this.paymentOperations$])
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe(() => this.loadSelectedOperation());

		this.destroyRef.onDestroy(() => {
			unregisterLeaveEditor();
			this.isDestroyed = true;
			this.executionToken++;
		});

		this.activePaymentAccountId$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(accountId => {
			const nextAccountId = accountId?.toString();
			if (this.activeAccountId && this.activeAccountId !== nextAccountId) {
				this.paymentEditorSession.reset();
				this.store.dispatch(new SetActiveAccountingOperation(undefined));
			}
			this.activeAccountId = nextAccountId;
			this.executionToken++;
		});

		this.paymentForm.controls.direction.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
			const categoryId = this.paymentForm.controls.categoryId.value;
			if (!this.filteredCategoriesSignal().some(category => category.key.toString() === categoryId)) {
				this.paymentForm.controls.categoryId.setValue('');
			}
		});
	}

	public async canLeaveEditor(): Promise<boolean> {
		if (this.isSubmittingSignal()) {
			return false;
		}

		return this.isDirtySignal() ? this.paymentEditorLeaveService.confirmDiscard() : true;
	}

	public categoryName(category: ICategoryModel): string {
		return category.nameNodes.join(': ');
	}

	public contractorName(contractor: IContractorModel): string {
		return contractor.nameNodes.join(': ');
	}

	public async submitAsync(): Promise<void> {
		if (this.isSubmittingSignal()) {
			return;
		}

		if (this.paymentForm.invalid || !this.activeAccountIdSignal()) {
			this.paymentForm.markAllAsTouched();
			this.submissionStateSignal.set({
				status: 'failed',
				operation: this.operationKind(),
				message: 'Review the highlighted fields.',
			});
			return;
		}

		const operation = this.operationKind();
		if (operation === 'update' && !this.selectedOperationSignal()) {
			this.reconcileStaleSelection();
			this.submissionStateSignal.set({
				status: 'failed',
				operation,
				message: 'This payment is no longer available. Start a new payment or select a current record.',
			});
			return;
		}
		this.submissionStateSignal.set({ status: 'submitting', operation });

		const executionToken = ++this.executionToken;
		const expectedOperation = this.toPaymentOperation();
		const result =
			operation === 'create'
				? await this.paymentCommandExecutor.executeCreate(
						expectedOperation,
						this.pendingIntent,
						() => this.isCurrentExecution(executionToken),
						commandId => this.markAsProcessing(operation, executionToken, commandId)
					)
				: await this.paymentCommandExecutor.executeUpdate(
						expectedOperation,
						this.pendingIntent,
						() => this.isCurrentExecution(executionToken),
						commandId => this.markAsProcessing(operation, executionToken, commandId)
					);
		if (this.isCurrentExecution(executionToken)) {
			this.applyExecutionResult(operation, result, expectedOperation.key.toString());
		}
	}

	public async deleteAsync(): Promise<void> {
		const operation = this.selectedOperationSignal();
		if (!operation || this.isSubmittingSignal()) {
			return;
		}

		const confirmed = await firstValueFrom(
			this.dialog
				.open<PaymentDeleteDialogComponent, PaymentDeleteDialogData, boolean>(PaymentDeleteDialogComponent, {
					data: this.deleteDialogData(operation),
					restoreFocus: true,
				})
				.afterClosed()
		);

		if (!confirmed) {
			return;
		}

		this.submissionStateSignal.set({ status: 'submitting', operation: 'delete' });
		const executionToken = ++this.executionToken;
		const accountId = this.activeAccountIdSignal();
		if (!accountId) {
			this.submissionStateSignal.set({
				status: 'failed',
				operation: 'delete',
				message: 'Choose an account before deleting a payment.',
			});
			return;
		}
		const result = await this.paymentCommandExecutor.executeDelete(
			accountId.toString(),
			operation.key.toString(),
			this.pendingIntent,
			() => this.isCurrentExecution(executionToken),
			commandId => this.markAsProcessing('delete', executionToken, commandId)
		);
		if (this.isCurrentExecution(executionToken)) {
			this.applyExecutionResult('delete', result, operation.key.toString());
		}
	}

	public cancel(): void {
		this.executionToken++;
		this.submissionStateSignal.set({ status: 'idle' });
		if (this.editorModeSignal() === 'edit') {
			this.paymentForm.reset(this.baselineValue());
			return;
		}

		this.initializeForm(this.defaultValue());
	}

	public async addCategory(): Promise<void> {
		const category = await firstValueFrom(this.categoriesDialogService.openCategories());
		if (category) {
			this.paymentForm.controls.direction.setValue(category.operationType);
			this.paymentForm.controls.categoryId.setValue(category.key.toString());
		}
	}

	public async addContractor(): Promise<void> {
		const contractor = await firstValueFrom(this.contractorsDialogService.openContractors());
		if (contractor) {
			this.paymentForm.controls.contractorId.setValue(contractor.key.toString());
		}
	}

	private applyExecutionResult(
		operation: 'create' | 'update' | 'delete',
		result: PaymentCommandExecutionResult,
		operationId: string
	): void {
		if (this.isDestroyed) {
			return;
		}
		if (result.status === 'unknown') {
			this.pendingIntent = result.intent;
			this.submissionStateSignal.set({
				status: 'uncertain',
				operation,
				message:
					result.message ??
					"We couldn't confirm whether this payment was accepted. Retry to check its status.",
			});
			return;
		}

		this.pendingIntent = undefined;
		if (result.status !== 'projected') {
			this.submissionStateSignal.set({
				status: 'failed',
				operation,
				message: result.message ?? 'Payment could not be completed.',
			});
			return;
		}

		this.captureBaseline();
		this.submissionStateSignal.set({
			status: 'succeeded',
			operation,
			operationId: result.paymentOperationId ?? operationId,
		});
		if (operation === 'create') {
			this.paymentEditorSession.queueRecentMutation(
				Guid.parse(result.paymentOperationId ?? operationId),
				'created'
			);
			this.paymentEditorSession.beginCreate();
			this.resetNewPaymentForm();
			this.store.dispatch(new SetActiveAccountingOperation(undefined));
		}
		if (operation === 'update') {
			this.paymentEditorSession.queueRecentMutation(
				Guid.parse(result.paymentOperationId ?? operationId),
				'updated'
			);
			this.loadedOperationId = undefined;
			this.loadSelectedOperation();
		}
		if (operation === 'delete') {
			this.paymentEditorSession.beginCreate();
			this.resetNewPaymentForm();
			this.store.dispatch(new SetActiveAccountingOperation(undefined));
		}
	}

	private loadSelectedOperation(): void {
		const operation = this.selectedOperationSignal();
		const selectedOperationId = this.selectedRecordGuidSignal();
		if (selectedOperationId && !operation) {
			this.reconcileStaleSelection();
			return;
		}

		const operationId = operation?.key.toString();
		if (operationId === this.loadedOperationId) {
			return;
		}

		this.loadedOperationId = operationId;
		this.pendingIntent = undefined;
		if (operation) {
			this.paymentEditorSession.beginEdit();
		} else {
			this.paymentEditorSession.beginCreate();
		}
		this.initializeForm(operation ? this.valueFromOperation(operation) : this.defaultValue());
		this.submissionStateSignal.set({ status: 'idle' });
	}

	private toPaymentOperation(): IPaymentOperationModel {
		const value = this.paymentForm.getRawValue();
		const existingOperation = this.selectedOperationSignal();
		return {
			key: existingOperation?.key ?? Guid.EMPTY,
			paymentAccountId: Guid.parse(this.activeAccountIdSignal()!.toString()),
			operationDate: this.businessDate(value.operationDate),
			amount: value.amount,
			categoryId: Guid.parse(value.categoryId),
			contractorId: value.contractorId ? Guid.parse(value.contractorId) : Guid.EMPTY,
			comment: value.comment.trim(),
			operationType: OperationTypes.Payment,
		};
	}

	private valueFromOperation(operation: IPaymentOperationModel): PaymentEditorValue {
		const category = this.categoriesSignal().find(item => item.key.equals(operation.categoryId));
		return {
			amount: Math.abs(operation.amount),
			categoryId: operation.categoryId.toString(),
			comment: operation.comment,
			contractorId: operation.contractorId?.equals(Guid.EMPTY) ? '' : operation.contractorId.toString(),
			direction: category?.operationType ?? PaymentOperationTypes.Expense,
			operationDate: this.businessDate(operation.operationDate),
		};
	}

	private defaultValue(): PaymentEditorValue {
		return {
			amount: 0,
			categoryId: '',
			comment: '',
			contractorId: '',
			direction: PaymentOperationTypes.Expense,
			operationDate: this.businessDateToday(),
		};
	}

	private deleteDialogData(operation: IPaymentOperationModel): PaymentDeleteDialogData {
		const category = this.categoriesSignal().find(item => item.key.equals(operation.categoryId));
		const contractor = this.contractorsSignal().find(item => item.key.equals(operation.contractorId));
		return {
			amount: Math.abs(operation.amount),
			category: category ? this.categoryName(category) : 'Uncategorized',
			currency: this.activeAccountSignal()?.currency ?? '',
			date: this.asDateInput(operation.operationDate),
			payee: contractor ? this.contractorName(contractor) : '',
		};
	}

	private operationKind(): 'create' | 'update' {
		return this.editorModeSignal() === 'create' ? 'create' : 'update';
	}

	private reconcileStaleSelection(): void {
		this.paymentEditorSession.beginCreate();
		this.resetNewPaymentForm();
		this.store.dispatch(new SetActiveAccountingOperation(undefined));
	}

	private resetNewPaymentForm(): void {
		this.loadedOperationId = undefined;
		this.initializeForm(this.defaultValue());
		this.submissionStateSignal.set({ status: 'idle' });
	}

	private initializeForm(value: PaymentEditorValue): void {
		this.paymentForm.reset(value);
		this.captureBaseline();
	}

	private captureBaseline(): void {
		this.baselineSignal.set(this.normalizeEditableValue(this.paymentForm.getRawValue()));
	}

	private baselineValue(): PaymentEditorValue {
		const baseline = this.baselineSignal();
		return {
			...baseline,
			amount: typeof baseline.amount === 'number' ? baseline.amount : Number(baseline.amount),
			operationDate: this.dateFromBusinessDay(baseline.operationDate),
		};
	}

	private normalizeEditableValue(value: Partial<PaymentEditorValue>): NormalizedPaymentEditorValue {
		const amount = Number(value.amount);
		return {
			amount: Number.isFinite(amount) ? amount : String(value.amount ?? ''),
			categoryId: this.stableId(value.categoryId),
			comment: value.comment?.trim() ?? '',
			contractorId: this.stableId(value.contractorId),
			direction: value.direction ?? PaymentOperationTypes.Expense,
			operationDate: this.normalizedDate(value.operationDate),
		};
	}

	private stableId(value: unknown): string {
		if (value === null || value === undefined || value === '' || value === Guid.EMPTY) {
			return '';
		}

		if (value instanceof Guid) {
			return value.equals(Guid.EMPTY) ? '' : value.toString().toLowerCase();
		}

		if (typeof value === 'object') {
			const identity = value as { id?: unknown; key?: unknown };
			return this.stableId(identity.key ?? identity.id);
		}

		if (typeof value !== 'string' && typeof value !== 'number') {
			return '';
		}

		const normalizedValue = `${value}`.toLowerCase();
		return normalizedValue === Guid.EMPTY.toString() ? '' : normalizedValue;
	}

	private normalizedDate(value: string | Date | undefined): string {
		if (value instanceof Date) {
			return this.asDateInput(value);
		}

		return value?.slice(0, 10) ?? '';
	}

	private areEquivalent(current: NormalizedPaymentEditorValue, baseline: NormalizedPaymentEditorValue): boolean {
		return (
			current.amount === baseline.amount &&
			current.categoryId === baseline.categoryId &&
			current.comment === baseline.comment &&
			current.contractorId === baseline.contractorId &&
			current.direction === baseline.direction &&
			current.operationDate === baseline.operationDate
		);
	}

	private isCurrentExecution(executionToken: number): boolean {
		return !this.isDestroyed && executionToken === this.executionToken;
	}

	private markAsProcessing(
		operation: 'create' | 'update' | 'delete',
		executionToken: number,
		commandId: string
	): void {
		if (this.isCurrentExecution(executionToken)) {
			this.submissionStateSignal.set({ status: 'waitingForProjection', operation, operationId: commandId });
		}
	}

	private businessDateToday(): Date {
		return this.businessDate(new Date());
	}

	private businessDate(date: Date): Date {
		return new Date(date.getFullYear(), date.getMonth(), date.getDate());
	}

	private dateFromBusinessDay(value: string): Date {
		const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
		if (!dateOnly) {
			return this.businessDateToday();
		}

		return new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]));
	}

	private asDateInput(date: Date): string {
		const year = date.getFullYear();
		const month = `${date.getMonth() + 1}`.padStart(2, '0');
		const day = `${date.getDate()}`.padStart(2, '0');
		return `${year}-${month}-${day}`;
	}
}
