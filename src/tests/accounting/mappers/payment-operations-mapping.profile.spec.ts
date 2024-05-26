import { getTestBed, TestBed } from '@angular/core/testing';

import _ from 'lodash';

import { Mapper, MapperModule } from '@dynamic-mapper/angular';
import { Guid } from 'typescript-guid';

import { IPaymentOperationEntity } from '../../../data/providers/accounting/entities/payment-operation.entity';
import { PaymentOperationsMappingProfile } from '../../../data/providers/accounting/mappers/payment-operations.mapping.profile';
import { IPaymentOperationModel } from '../../../domain/models/accounting/payment-operation.model';

describe('payment-operations-mapping.profile tests', () => {
	let mapper: Mapper;

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [MapperModule.withProfiles([PaymentOperationsMappingProfile])],
			providers: [Mapper],
		});

		mapper = getTestBed().inject(Mapper);
	});

	it('should corretly map with "PaymentOperaionEntityToDomain" mapping pair', () => {
		const paymentEntities: IPaymentOperationEntity[] = [
			{
				key: 'b1e65663-cb80-4db9-8f10-24c245655a2e',
				contractorId: 'a249b2e9-edf0-45f2-a274-92ac310d4008',
				categoryId: '3b2a138e-f575-425a-8650-a309480a6ece',
				paymentAccountId: '78f5743a-715b-402b-801b-ed88193c1195',
				operationDay: '2024-01-12',
				comment: 'comments 1',
				amount: 11.88,
			} as IPaymentOperationEntity,
			{
				key: '1c78e31e-cfaa-43aa-af38-b5f822fff3fa',
				contractorId: 'a249b2e9-edf0-45f2-a274-92ac310d4008',
				categoryId: '3b2a138e-f575-425a-8650-a309480a6ece',
				paymentAccountId: '78f5743a-715b-402b-801b-ed88193c1195',
				operationDay: '2024-01-14',
				comment: 'comments',
				amount: 11.45,
			} as IPaymentOperationEntity,
		];

		const result = mapper.map(PaymentOperationsMappingProfile.PaymentOperationEntityToDomain, paymentEntities);

		expect(result.length).toBe(2);

		const recordEntity: IPaymentOperationModel = _.first(result)!;

		expect(recordEntity.amount).toBe(11.88);
		expect(recordEntity.comment).toBe('comments 1');
		expect(recordEntity.operationDate.toJSON()).toBe(new Date(paymentEntities[0].operationDay).toJSON());
		expect(recordEntity.categoryId.equals(Guid.parse('3b2a138e-f575-425a-8650-a309480a6ece'))).toBeTruthy();
		expect(recordEntity.contractorId.equals(Guid.parse('a249b2e9-edf0-45f2-a274-92ac310d4008'))).toBeTruthy();
		expect(recordEntity.paymentAccountId.equals(Guid.parse('78f5743a-715b-402b-801b-ed88193c1195'))).toBeTruthy();
		expect(recordEntity.key.equals(Guid.parse('b1e65663-cb80-4db9-8f10-24c245655a2e'))).toBeTruthy();
	});

	it('should corretly map with "DomainToPaymentOperationSaveRequest" mapping pair', () => {
		const payments: IPaymentOperationModel[] = [
			{
				key: Guid.parse('25795a7e-a267-423f-9951-5ab1f042226c'),
				contractorId: Guid.parse('eaeddd7d-5ed8-4a58-ab49-2d05c075c169'),
				categoryId: Guid.parse('cfe0f723-4cd9-4562-8e59-10a53bb49bd0'),
				paymentAccountId: Guid.parse('d100b3de-2f87-4056-9e57-5057d890e3b1'),
				comment: 'test',
				amount: 11.2,
				operationDate: new Date(2024, 1, 10),
			} as IPaymentOperationModel,
		];

		const requests = mapper.map(PaymentOperationsMappingProfile.DomainToPaymentOperationSaveRequest, payments);

		expect(requests.length).toBe(1);

		const request = _.first(requests)!;

		expect(request.amount).toBe(11.2);
		expect(request.categoryId).toEqual('cfe0f723-4cd9-4562-8e59-10a53bb49bd0');
		expect(request.contractorId).toEqual('eaeddd7d-5ed8-4a58-ab49-2d05c075c169');
		expect(request.comment).toBe('test');
		expect(request.operationDate).toBe('2024-02-10');
	});
});
