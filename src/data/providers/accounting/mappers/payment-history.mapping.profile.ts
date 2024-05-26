import _ from 'lodash';

import { MappingPair, Profile } from '@dynamic-mapper/mapper';

import { PaymentOperationsMappingProfile } from './payment-operations.mapping.profile';
import { IPaymentHistoryModel } from '../../../../domain/models/accounting/payment-history.model';
import { IPaymentHistoryEntity } from '../entities/payment-history.entity';

export class PaymentHistoryMappingProfile extends Profile {
	static readonly PaymentOperationHistoryEntityToDomain = new MappingPair<
		IPaymentHistoryEntity,
		IPaymentHistoryModel
	>();

	constructor() {
		super();

		this.createMap(PaymentHistoryMappingProfile.PaymentOperationHistoryEntityToDomain, {
			balance: opt => {
				opt.preCondition(src => !_.isNil(src.balance));
				opt.mapFrom(src => src.balance);
			},
			record: opt => {
				opt.preCondition(src => !_.isNil(src.record));
				opt.mapFromUsing(src => src.record, PaymentOperationsMappingProfile.PaymentOperationEntityToDomain);
			},
		});
	}
}
