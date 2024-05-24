import { getTestBed, TestBed } from '@angular/core/testing';

import _ from 'lodash';

import { Mapper, MapperModule } from '@dynamic-mapper/angular';
import { NgxsModule, Store } from '@ngxs/store';
import { Guid } from 'typescript-guid';

import { SetInitialCategories } from 'app/modules/shared/store/states/handbooks/actions/category.actions';
import { SetInitialContractors } from 'app/modules/shared/store/states/handbooks/actions/contractor.actions';
import { IPaymentRepresentationModel } from 'presentation/accounting/models/operation-record';

import { CategoriesState } from '../../../app/modules/shared/store/states/handbooks/categories.state';
import { ContractorsState } from '../../../app/modules/shared/store/states/handbooks/contractors.state';
import { HandbooksState } from '../../../app/modules/shared/store/states/handbooks/handbooks.state';
import { PaymentRepresentationsMappingProfile } from '../../../data/providers/accounting/mappers/payment-representations.mapping.profile';
import { ICategoryModel } from '../../../domain/models/accounting/category.model';
import { IContractorModel } from '../../../domain/models/accounting/contractor.model.';
import { PaymentOperationTypes } from '../../../domain/models/accounting/operation-types';
import { IPaymentHistoryModel } from '../../../domain/models/accounting/payment-history.model';
import { IPaymentOperationModel } from '../../../domain/models/accounting/payment-operation.model';

describe('payment-representations-mapping.profile tests', () => {
	let mapper: Mapper;
	let store: Store;

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [
				NgxsModule.forRoot([HandbooksState, ContractorsState, CategoriesState]),
				MapperModule.withProfiles([PaymentRepresentationsMappingProfile]),
			],
			providers: [Mapper],
		});

		mapper = getTestBed().inject(Mapper);

		store = TestBed.inject(Store);

		store.dispatch(
			new SetInitialContractors([
				{
					key: Guid.parse('a249b2e9-edf0-45f2-a274-92ac310d4008'),
					nameNodes: ['test_contractor_node_1'],
				} as IContractorModel,
			])
		);
	});

	it('should correctly map with "PaymentHistoryToRepresentationModel" mapping pair with up to date handbooks', () => {
		store.dispatch(
			new SetInitialCategories([
				{
					key: Guid.parse('3b2a138e-f575-425a-8650-a309480a6ece'),
					operationType: PaymentOperationTypes.Income,
					nameNodes: ['test_category_node_1', 'test_category_node_2'],
				} as ICategoryModel,
			])
		);

		const paymentEntities: IPaymentHistoryModel[] = [
			{
				balance: 100.2,
				record: {
					paymentAccountId: Guid.EMPTY,
					key: Guid.parse('1c78e31e-cfaa-43aa-af38-b5f822fff3fa'),
					amount: 11.45,
					contractorId: Guid.parse('a249b2e9-edf0-45f2-a274-92ac310d4008'),
					categoryId: Guid.parse('3b2a138e-f575-425a-8650-a309480a6ece'),
					operationDate: new Date(2024, 0, 18),
					comment: 'comments 1',
				},
			} as IPaymentHistoryModel,
		];

		const result = mapper.map(
			PaymentRepresentationsMappingProfile.PaymentHistoryToRepresentationModel,
			paymentEntities
		);

		expect(result.length).toBe(1);

		const record: IPaymentRepresentationModel = _.first(result)!;

		expect(record.key.equals(Guid.parse('1c78e31e-cfaa-43aa-af38-b5f822fff3fa'))).toBeTruthy();
		expect(record.income).toBe(11.45);
		expect(record.expense).toBe(0);
		expect(record.contractor).toBe('test_contractor_node_1');
		expect(record.category).toBe('test_category_node_1: test_category_node_2');
		expect(record.balance).toBe(100.2);
		expect(record.comment).toBe('comments 1');
		expect(record.operationDate.toJSON()).toBe(new Date(paymentEntities[0].record.operationDate).toJSON());
	});

	it('should correctly map with "PaymentHistoryToRepresentationModel" when operation time is an expense', () => {
		store.dispatch(
			new SetInitialCategories([
				{
					key: Guid.parse('7ae67a56-2f85-4db1-b409-bb6e2c61d772'),
					operationType: PaymentOperationTypes.Expense,
					nameNodes: ['expense_1', 'test_category_node_2'],
				} as ICategoryModel,
			])
		);

		const paymentEntities: IPaymentHistoryModel[] = [
			{
				balance: 100.2,
				record: {
					paymentAccountId: Guid.EMPTY,
					key: Guid.parse('1c78e31e-cfaa-43aa-af38-b5f822fff3fa'),
					amount: 11.45,
					contractorId: Guid.parse('a249b2e9-edf0-45f2-a274-92ac310d4008'),
					categoryId: Guid.parse('7ae67a56-2f85-4db1-b409-bb6e2c61d772'),
					operationDate: new Date(2024, 0, 18),
					comment: 'comments 1',
				},
			} as IPaymentHistoryModel,
		];

		const result = mapper.map(
			PaymentRepresentationsMappingProfile.PaymentHistoryToRepresentationModel,
			paymentEntities
		);

		expect(result.length).toBe(1);

		const record: IPaymentRepresentationModel = _.first(result)!;

		expect(record.expense).toBe(-11.45);
	});

	it('should corretly map with "PaymentHistoryToRepresentationModel" mapping pair without up to date handbooks', () => {
		const paymentEntities: IPaymentHistoryModel[] = [
			{
				balance: 11.2,
				record: {
					paymentAccountId: Guid.EMPTY,
					key: Guid.parse('1c78e31e-cfaa-43aa-af38-b5f822fff3fa'),
					amount: 11.45,
					contractorId: Guid.parse('a249b2e9-edf0-45f2-a274-92ac310d4008'),
					categoryId: Guid.parse('3b2a138e-f575-425a-8650-a309480a6ece'),
					operationDate: new Date(2024, 0, 18),
					comment: 'comments 1',
				},
			} as IPaymentHistoryModel,
		];

		const result = mapper.map(
			PaymentRepresentationsMappingProfile.PaymentHistoryToRepresentationModel,
			paymentEntities
		);

		expect(result.length).toBe(1);

		const record: IPaymentRepresentationModel = _.first(result)!;

		expect(record.category).toBe('N/A');
		expect(record.contractor).toBe('test_contractor_node_1');
		expect(record.balance).toBe(11.2);
		expect(record.comment).toBe('comments 1');
		expect(record.operationDate.toJSON()).toBe(new Date(paymentEntities[0].record.operationDate).toJSON());
	});

	it('should correctly map with "PaymentOperationToRepresentationModel" mapping pair with up to date handbooks', () => {
		store.dispatch(
			new SetInitialCategories([
				{
					key: Guid.parse('3b2a138e-f575-425a-8650-a309480a6ece'),
					operationType: PaymentOperationTypes.Income,
					nameNodes: ['test_category_node_1', 'test_category_node_2'],
				} as ICategoryModel,
			])
		);

		const paymentEntities: IPaymentOperationModel[] = [
			{
				paymentAccountId: Guid.EMPTY,
				key: Guid.parse('1c78e31e-cfaa-43aa-af38-b5f822fff3fa'),
				amount: 11.45,
				contractorId: Guid.parse('a249b2e9-edf0-45f2-a274-92ac310d4008'),
				categoryId: Guid.parse('3b2a138e-f575-425a-8650-a309480a6ece'),
				operationDate: new Date(2024, 0, 18),
				comment: 'comments 2',
			} as IPaymentOperationModel,
		];

		const result = mapper.map(
			PaymentRepresentationsMappingProfile.PaymentOperationToRepresentationModel,
			paymentEntities
		);

		expect(result.length).toBe(1);

		const record: IPaymentRepresentationModel = _.first(result)!;

		expect(record.category).toBe('test_category_node_1: test_category_node_2');
		expect(record.contractor).toBe('test_contractor_node_1');
		expect(record.income).toBe(11.45);
		expect(record.comment).toBe('comments 2');
		expect(record.operationDate.toJSON()).toBe(new Date(paymentEntities[0].operationDate).toJSON());
	});

	it('should corretly map with "PaymentOperationToRepresentationModel" mapping pair without up to date handbooks', () => {
		const paymentEntities: IPaymentOperationModel[] = [
			{
				paymentAccountId: Guid.EMPTY,
				key: Guid.parse('1c78e31e-cfaa-43aa-af38-b5f822fff3fa'),
				amount: 11.45,
				contractorId: Guid.parse('a249b2e9-edf0-45f2-a274-92ac310d4008'),
				categoryId: Guid.parse('3b2a138e-f575-425a-8650-a309480a6ece'),
				operationDate: new Date(2024, 0, 18),
				comment: 'comments 2',
			} as IPaymentOperationModel,
		];

		const result = mapper.map(
			PaymentRepresentationsMappingProfile.PaymentOperationToRepresentationModel,
			paymentEntities
		);

		expect(result.length).toBe(1);

		const record: IPaymentRepresentationModel = _.first(result)!;

		expect(record.key.equals(Guid.parse('1c78e31e-cfaa-43aa-af38-b5f822fff3fa'))).toBeTruthy();
		expect(record.contractor).toBe('test_contractor_node_1');
		expect(record.category).toBe('N/A');
		expect(record.comment).toBe('comments 2');
		expect(record.operationDate.toJSON()).toBe(new Date(paymentEntities[0].operationDate).toJSON());
	});
});
