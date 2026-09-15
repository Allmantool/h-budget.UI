import { HttpClient } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { Mapper, MapperModule } from '@dynamic-mapper/angular';

import { PaymentHistoryMappingProfile } from '../../../data/providers/accounting/mappers/payment-history.mapping.profile';
import { PaymentOperationsMappingProfile } from '../../../data/providers/accounting/mappers/payment-operations.mapping.profile';
import { PaymentsHistoryProvider } from '../../../data/providers/accounting/payments-history.provider';
import { defaultPaymentHistoryQuery } from '../../../domain/models/accounting/payment-history-query.model';

describe('payments history provider paged query', () => {
	const gatewayHost = 'https://gateway.example.test';
	const accountId = '199fe6c8-1605-4ec0-be16-8da34919c462';
	let httpTestingController: HttpTestingController;
	let provider: PaymentsHistoryProvider;

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [
				HttpClientTestingModule,
				MapperModule.withProfiles([PaymentHistoryMappingProfile, PaymentOperationsMappingProfile]),
			],
			providers: [Mapper],
		});
		httpTestingController = TestBed.inject(HttpTestingController);
		provider = new PaymentsHistoryProvider(TestBed.inject(HttpClient), TestBed.inject(Mapper), {
			settings: { gatewayHost },
		});
	});

	afterEach(() => httpTestingController.verify());

	it('sends the default paged query and maps a JSON history record through Angular HTTP', () => {
		let resultRecordId: string | undefined;
		provider.getPagedOperationsHistoryForPaymentAccount(accountId, defaultPaymentHistoryQuery).subscribe(page => {
			resultRecordId = page.items[0].record.key.toString();
			expect(page.items[0].record.operationDate).toEqual(new Date(2026, 8, 7));
			expect(page.items[0].balance).toBe(-11);
		});

		const request = httpTestingController.expectOne(
			request => request.url === `${gatewayHost}/accounting/payments-history/query/${accountId}`
		);
		expect(request.request.method).toBe('GET');
		expect(request.request.params.keys().sort()).toEqual(['page', 'pageSize', 'sortBy', 'sortDirection']);
		expect(request.request.params.get('page')).toBe('1');
		expect(request.request.params.get('pageSize')).toBe('25');
		expect(request.request.params.get('sortBy')).toBe('date');
		expect(request.request.params.get('sortDirection')).toBe('desc');
		request.flush(createResponse());

		expect(resultRecordId).toBe('9e141f36-ac99-46d6-b526-431e67a88e07');
	});

	it('omits cleared optional filters from the HTTP query', () => {
		provider
			.getPagedOperationsHistoryForPaymentAccount(accountId, {
				...defaultPaymentHistoryQuery,
				dateFrom: '',
				categoryId: '',
				contractorId: undefined,
				amountMin: undefined,
			})
			.subscribe();

		const request = httpTestingController.expectOne(
			request => request.url === `${gatewayHost}/accounting/payments-history/query/${accountId}`
		);
		expect(request.request.params.has('dateFrom')).toBeFalse();
		expect(request.request.params.has('categoryId')).toBeFalse();
		expect(request.request.params.has('contractorId')).toBeFalse();
		expect(request.request.params.has('amountMin')).toBeFalse();
		request.flush(createResponse());
	});

	function createResponse() {
		return {
			payload: {
				items: [
					{
						record: {
							key: '9e141f36-ac99-46d6-b526-431e67a88e07',
							transactionType: 1,
							operationDay: '2026-09-07',
							comment: 'Some comment',
							contractorId: '7fba5b52-27bf-4e73-9a12-e1503457ae5f',
							categoryId: '850935c3-1e14-448f-be1c-30ef6f088fb5',
							paymentAccountId: accountId,
							relatedPaymentAccountId: null,
							conversionMultiplier: null,
							amount: 56,
						},
						balance: -11,
					},
				],
				page: 1,
				pageSize: 25,
				totalCount: 1,
				totalPages: 1,
				hasPreviousPage: false,
				hasNextPage: false,
			},
			isSucceeded: true,
		};
	}
});
