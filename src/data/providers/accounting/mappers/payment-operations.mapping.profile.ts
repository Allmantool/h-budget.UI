import * as _ from 'lodash';

import { MappingPair, Profile } from '@dynamic-mapper/mapper';

import { Guid } from 'typescript-guid';

import { PaymentOperationModel } from '../../../../domain/models/accounting/payment-operation.model';
import { PaymentOperationEntity } from '../entities/payment-operation.entity';

export class PaymentOperationsMappingProfile extends Profile {
	static readonly PaymentOperaionEntityToDomain = new MappingPair<PaymentOperationEntity, PaymentOperationModel>();

	constructor() {
		super();

		this.createMap(PaymentOperationsMappingProfile.PaymentOperaionEntityToDomain, {
			key: opt => {
				opt.preCondition(src => !_.isNil(src.key));
				opt.mapFrom(src => Guid.parse(src.key));
			},
			contractorId: opt => {
				opt.preCondition(src => !_.isNil(src.contractorId));
				opt.mapFrom(src => Guid.parse(src.contractorId));
			},
			categoryId: opt => {
				opt.preCondition(src => !_.isNil(src.categoryId));
				opt.mapFrom(src => Guid.parse(src.categoryId));
			},
			paymentAccountId: opt => {
				opt.preCondition(src => !_.isNil(src.paymentAccountId));
				opt.mapFrom(src => Guid.parse(src.paymentAccountId));
			},
			comment: opt => {
				opt.preCondition(src => !_.isNil(src.comment));
				opt.mapFrom(src => src.comment);
			},
			operationDate: opt => {
				opt.preCondition(src => !_.isNil(src.operationDate));
				opt.mapFrom(src => new Date(src.operationDate));
			},
		});
	}
}
