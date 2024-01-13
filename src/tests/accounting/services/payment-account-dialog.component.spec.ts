/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { NgxsModule } from '@ngxs/store';
import { of } from 'rxjs';
import { Guid } from 'typescript-guid';

import { PaymentAccountState } from 'app/modules/shared/store/states/accounting/payment-account.state';

import { AppCoreModule } from '../../../app/modules/core/core.module';
import { AngularMaterailSharedModule } from '../../../app/modules/shared/angular-material.shared.module';
import { PaymentAccountDialogComponent } from '../../../app/modules/shared/components/dialog/payment-account/payment-account-dialog.component';
import { CustomUIComponentsSharedModule } from '../../../app/modules/shared/custom-ui-components.shared.module';
import { DialogContainer } from '../../../app/modules/shared/models/dialog-container';
import { DialogOperationTypes } from '../../../app/modules/shared/models/dialog-operation-types';
import { DialogProvider } from '../../../app/modules/shared/providers/dialog-provider';
import { AppSharedModule } from '../../../app/modules/shared/shared.module';
import { ngxsConfig } from '../../../app/modules/shared/store/ngxs.config';
import { Result } from '../../../core/result';
import { DefaultPaymentAccountsProvider } from '../../../data/providers/accounting/payment-accounts.provider';
import { IPaymentAccountModel } from '../../../domain/models/accounting/payment-account.model';
import { PaymentAccountDialogService } from '../../../presentation/accounting/services/payment-account-dialog.service';
import { AccountTypes } from 'domain/models/accounting/account-types';

describe('Payment-account-dialog.component', () => {
	let paymentAccountsProviderSpy: jasmine.SpyObj<DefaultPaymentAccountsProvider>;
	let dialogProviderSpy: jasmine.SpyObj<DialogProvider>;

	const matDialogSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

	const mockDialogContainer: DialogContainer = {
		title: 'test-title',
		operationType: DialogOperationTypes.Create,
		onSubmit: <DaysRangePayload>(payload: DaysRangePayload) => of<DaysRangePayload>(payload),
	};

	let sut: PaymentAccountDialogService;

	beforeEach(() => {
		dialogProviderSpy = jasmine.createSpyObj('dialogProvider', ['openDialog']);

		paymentAccountsProviderSpy = jasmine.createSpyObj('paymentAccountsProvider', {
			savePaymentAccount: (newPaymentAccount: IPaymentAccountModel) =>
				of<Result<string>>(
					new Result({
						payload: 'bb6d182f-8b99-4e09-aa24-319b181178e3',
					})
				),
			getPaymentAccountById: (paymentAccountId: string) =>
				of<IPaymentAccountModel>({
					key: Guid.parse(''),
					type: AccountTypes.Loan,
					currency: 'usd',
					balance: 11.2,
					emitter: 'test-emitter',
					description: 'test-description-' + paymentAccountId,
				} as IPaymentAccountModel),
			updatePaymentAccount: (updatedPaymentAccount: IPaymentAccountModel, accountGuid: string) =>
				of<Result<string>>(
					new Result({
						payload: 'bb6d182f-8b99-4e09-aa24-319b181178e3',
					})
				),
		});

		TestBed.configureTestingModule({
			imports: [
				AppCoreModule,
				AngularMaterailSharedModule,
				CustomUIComponentsSharedModule,
				AppSharedModule,
				NgxsModule.forRoot([PaymentAccountState], ngxsConfig),
			],
			providers: [
				PaymentAccountDialogComponent,
				PaymentAccountDialogService,
				{
					provide: MatDialogRef,
					useValue: matDialogSpy,
				},

				{
					provide: MAT_DIALOG_DATA,
					useValue: mockDialogContainer,
				},
				{
					provide: DialogProvider,
					useValue: dialogProviderSpy,
				},
				{
					provide: DefaultPaymentAccountsProvider,
					useValue: paymentAccountsProviderSpy,
				},
			],
		});

		sut = TestBed.inject(PaymentAccountDialogService);
	});

	it('"DialogProvider" should be execute at least ones', () => {
		sut.openPaymentAccountForSave();

		const componentUnderTest = TestBed.inject(PaymentAccountDialogComponent);

		componentUnderTest.applyChanges();

		expect(dialogProviderSpy.openDialog).toHaveBeenCalled();
	});
});
