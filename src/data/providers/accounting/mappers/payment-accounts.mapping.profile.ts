import { MappingPair, Profile } from '@dynamic-mapper/mapper';
import { Guid } from 'typescript-guid';
import * as _ from 'lodash';

import { PaymentAccountModel } from '../../../../domain/models/accounting/payment-account.model';
import { PaymentAccountEntity } from '../entities/payment-account.entity';
import { PaymentAccountCreateOrUpdateRequest } from '../../../../domain/models/accounting/requests/payment-account-create-or-update.request';

export class PaymentAccountsMappingProfile extends Profile {
	static readonly PaymentAccountEntityToDomain = new MappingPair<PaymentAccountEntity, PaymentAccountModel>();

	static readonly DomainToPaymentAccountCreateRequest = new MappingPair<
		PaymentAccountModel,
		PaymentAccountCreateOrUpdateRequest
	>();

	constructor() {
		super();

		this.createMap(PaymentAccountsMappingProfile.PaymentAccountEntityToDomain, {
			key: opt => {
				opt.preCondition(src => !_.isNil(src.key));
				opt.mapFrom(src => Guid.parse(src.key));
			},
			type: opt => {
				opt.preCondition(src => !_.isNil(src.type));
				opt.mapFrom(src => src.type); // should work (should be checked)
			},
			currency: opt => {
				opt.preCondition(src => !_.isNil(src.currency));
				opt.mapFrom(src => src.currency);
			},
			balance: opt => {
				opt.preCondition(src => !_.isNil(src.balance));
				opt.mapFrom(src => src.balance);
			},
			emitter: opt => {
				opt.preCondition(src => !_.isNil(src.agent));
				opt.mapFrom(src => src.agent);
			},
			description: opt => {
				opt.preCondition(src => !_.isNil(src.description));
				opt.mapFrom(src => src.description);
			},
		});

		this.createMap(PaymentAccountsMappingProfile.DomainToPaymentAccountCreateRequest, {
			accountType: opt => {
				opt.preCondition(src => !_.isNil(src.type));
				opt.mapFrom(src => src.type); // should work (should be checked)
			},
			currency: opt => {
				opt.preCondition(src => !_.isNil(src.currency));
				opt.mapFrom(src => src.currency);
			},
			balance: opt => {
				opt.preCondition(src => !_.isNil(src.balance));
				opt.mapFrom(src => src.balance);
			},
			agent: opt => {
				opt.preCondition(src => !_.isNil(src.emitter));
				opt.mapFrom(src => src.emitter);
			},
			description: opt => {
				opt.preCondition(src => !_.isNil(src.description));
				opt.mapFrom(src => src.description);
			},
		});
	}
}
