import { HttpClient } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { Mapper } from '@dynamic-mapper/angular';
import { Guid } from 'typescript-guid';

import { PaymentOperationsProvider } from '../../data/providers/accounting/payment-operations.provider';
import { IPaymentOperationModel } from '../../domain/models/accounting/payment-operation.model';
import { OperationTypes } from '../../domain/types/operation.types';

describe('payment operations provider write retry behavior', () => {
	const gatewayHost = 'https://gateway.example.test';
	const accountId = '1c12ec59-8875-45c1-9fb0-e4edcf34a074';
	const operationId = '22222222-2222-2222-2222-222222222222';
	let httpTestingController: HttpTestingController;
	let sut: PaymentOperationsProvider;

	beforeEach(() => {
		TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
		httpTestingController = TestBed.inject(HttpTestingController);
		const mapper = jasmine.createSpyObj<Mapper>('mapper', ['map']);
		mapper.map.and.returnValue([]);
		sut = new PaymentOperationsProvider(TestBed.inject(HttpClient), mapper, {
			settings: { gatewayHost },
		});
	});

	afterEach(() => httpTestingController.verify());

	it('does not retry a failed POST', () => {
		sut.savePaymentOperation(accountId, createOperation()).subscribe({ error: () => undefined });

		const request = httpTestingController.expectOne(`${gatewayHost}/accounting/payment-operations/${accountId}`);
		expect(request.request.method).toBe('POST');
		request.flush(null, { status: 500, statusText: 'Server Error' });
		httpTestingController.expectNone(`${gatewayHost}/accounting/payment-operations/${accountId}`);
	});

	it('does not retry a failed PATCH', () => {
		sut.updatePaymentOperation(createOperation(), accountId, operationId).subscribe({ error: () => undefined });

		const request = httpTestingController.expectOne(
			`${gatewayHost}/accounting/payment-operations/${accountId}/${operationId}`
		);
		expect(request.request.method).toBe('PATCH');
		request.flush(null, { status: 500, statusText: 'Server Error' });
		httpTestingController.expectNone(`${gatewayHost}/accounting/payment-operations/${accountId}/${operationId}`);
	});

	it('does not retry a failed DELETE', () => {
		sut.removePaymentOperation(accountId, operationId).subscribe({ error: () => undefined });

		const request = httpTestingController.expectOne(
			`${gatewayHost}/accounting/payment-operations/${accountId}/${operationId}`
		);
		expect(request.request.method).toBe('DELETE');
		request.flush(null, { status: 500, statusText: 'Server Error' });
		httpTestingController.expectNone(`${gatewayHost}/accounting/payment-operations/${accountId}/${operationId}`);
	});

	function createOperation(): IPaymentOperationModel {
		return {
			key: Guid.parse(operationId),
			paymentAccountId: Guid.parse(accountId),
			operationDate: new Date(2026, 0, 1),
			contractorId: Guid.EMPTY,
			categoryId: Guid.EMPTY,
			comment: '',
			amount: 1,
			operationType: OperationTypes.Payment,
		};
	}
});
