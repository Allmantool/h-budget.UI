import { getTestBed, TestBed } from '@angular/core/testing';

import _ from 'lodash';

import { Mapper, MapperModule } from '@dynamic-mapper/angular';
import { Guid } from 'typescript-guid';

import { IPaymentAccountEntity } from '../../../data/providers/accounting/entities/payment-account.entity';
import { PaymentAccountsMappingProfile } from '../../../data/providers/accounting/mappers/payment-accounts.mapping.profile';
import { AccountTypes } from '../../../domain/models/accounting/account-types';
import { IPaymentAccountModel } from '../../../domain/models/accounting/payment-account.model';

describe('payment-accounts-mapping.profile tests', () => {
	let mapper: Mapper;

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [MapperModule.withProfiles([PaymentAccountsMappingProfile])],
			providers: [Mapper],
		});

		mapper = getTestBed().inject(Mapper);
	});

	it('should corretly map with "DomainToPaymentAccountCreateRequest" mapping pair', () => {
		const paymentAccounts: IPaymentAccountEntity[] = [
			{
				key: 'b1e65663-cb80-4db9-8f10-24c245655a2e',
				description: 'd 1',
				agent: 'agent 1',
				accountType: 0,
				balance: 11.23,
				currency: 'USD',
			} as IPaymentAccountEntity,
			{
				key: '7ce79bb4-820e-446b-9291-8673ca1551de',
				description: 'd 2',
				agent: 'agent 3',
				accountType: 1,
				balance: 132.23,
				currency: 'EUR',
			} as IPaymentAccountEntity,
		];

		const result = mapper.map(PaymentAccountsMappingProfile.PaymentAccountEntityToDomain, paymentAccounts);

		expect(result.length).toBe(2);

		const paymentAccount: IPaymentAccountModel = _.first(result)!;

		expect(paymentAccount.balance).toBe(11.23);
		expect(paymentAccount.currency).toBe('USD');
		expect(paymentAccount.description).toBe('d 1');
		expect(paymentAccount.emitter).toBe('agent 1');
		expect(paymentAccount.key!.equals(Guid.parse('b1e65663-cb80-4db9-8f10-24c245655a2e'))).toBeTruthy();
		expect(paymentAccount.type).toBe(AccountTypes.WalletCache);
	});

	it('should corretly map with "DomainToPaymentAccountCreateRequest" mapping pair', () => {
		const paymentAccount: IPaymentAccountModel = {
			key: Guid.parse('511e4719-4395-4eda-b9e1-76fc5c3ab4df'),
			type: AccountTypes.Virtual,
			currency: 'RUS',
			balance: 77.2,
			emitter: 'emitter',
			description: 'test-description',
		};

		const result = mapper.map(PaymentAccountsMappingProfile.DomainToPaymentAccountCreateRequest, paymentAccount);

		expect(result.balance).toBe(77.2);
		expect(result.currency).toBe('RUS');
		expect(result.description).toBe('test-description');
		expect(result.accountType).toBe(1);
		expect(result.agent).toBe('emitter');
	});
});
