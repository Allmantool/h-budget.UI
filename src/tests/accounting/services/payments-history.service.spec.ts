/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { getTestBed, TestBed } from '@angular/core/testing';

import { Mapper, MapperModule } from '@dynamic-mapper/angular';
import { NgxsModule, Store } from '@ngxs/store';
import { of } from 'rxjs';
import { Guid } from 'typescript-guid';

import { ngxsConfig } from '../../../app/modules/shared/store/ngxs.config';
import { AccountingOperationsTableState } from '../../../app/modules/shared/store/states/accounting/accounting-operations-table.state';
import { SetInitialPaymentOperations } from '../../../app/modules/shared/store/states/accounting/actions/payment-operation.actions';
import { AccountingOperationsState } from '../../../app/modules/shared/store/states/accounting/payment-operations.state';
import { PaymentRepresentationsMappingProfile } from '../../../data/providers/accounting/mappers/payment-representations.mapping.profile';
import { PaymentsHistoryProvider } from '../../../data/providers/accounting/payments-history.provider';
import { IPaymentHistoryModel } from '../../../domain/models/accounting/payment-history.model';
import { IPaymentOperationModel } from '../../../domain/models/accounting/payment-operation.model';
import { PaymentsHistoryService } from '../../../presentation/accounting/services/payments-history.service';

describe('payments history service', () => {
	let sut: PaymentsHistoryService;

	let store: Store;
	let mapper: Mapper;

	let paymensHistoryProviderSpy: jasmine.SpyObj<PaymentsHistoryProvider>;

	const payload: IPaymentHistoryModel[] = [
		{
			balance: 123,
			record: {
				key: Guid.parse('12aaf693-7cb7-4ef5-b3b3-d75c07f733af'),
				paymentAccountId: Guid.parse('0ffda281-a97a-43a6-b83a-9182ad6fabc4'),
				contractorId: Guid.parse('686c4392-93cd-42e9-a208-d73d528be12a'),
				categoryId: Guid.parse('6284ba7e-c611-4ad3-acc1-b84fd27894e7'),
				operationDate: new Date('2024-01-26T03:24:00'),
				comment: 'test-comment',
				amount: 1024.2,
			} as IPaymentOperationModel,
		} as IPaymentHistoryModel,
	];

	beforeEach(() => {
		paymensHistoryProviderSpy = jasmine.createSpyObj('paymensHistoryProvider', {
			getOperationsHistoryForPaymentAccount: of<IPaymentHistoryModel[]>(payload),
		});

		TestBed.configureTestingModule({
			imports: [
				MapperModule.withProfiles([PaymentRepresentationsMappingProfile]),
				NgxsModule.forRoot([AccountingOperationsState, AccountingOperationsTableState], ngxsConfig),
			],
			providers: [
				PaymentsHistoryService,
				{
					provide: PaymentsHistoryProvider,
					useValue: paymensHistoryProviderSpy,
				},
			],
		});

		store = TestBed.inject(Store);
		mapper = getTestBed().inject(Mapper);

		sut = TestBed.inject(PaymentsHistoryService);

		const operationsPayload = [
			{
				key: Guid.parse('12aaf693-7cb7-4ef5-b3b3-d75c07f733af'),
				paymentAccountId: Guid.parse('0ffda281-a97a-43a6-b83a-9182ad6fabc4'),
				contractorId: Guid.parse('686c4392-93cd-42e9-a208-d73d528be12a'),
				categoryId: Guid.parse('6284ba7e-c611-4ad3-acc1-b84fd27894e7'),
				operationDate: new Date('2024-01-26T03:24:00'),
				comment: 'test-comment',
				amount: 1024.2,
			} as IPaymentOperationModel,
		];

		store.dispatch(new SetInitialPaymentOperations(operationsPayload));
	});

	it('should return selected history operation', (done: DoneFn) => {
		const result = sut.paymentOperationAsHistoryRecord();
		done();
	});

	it('should refresh history', (done: DoneFn) => {
		const result = sut.refreshPaymentsHistory('');
		done();
	});

	it('should refresh store', (done: DoneFn) => {
		const result = sut.refreshPaymentOperationsStore('');
		done();
	});
});
