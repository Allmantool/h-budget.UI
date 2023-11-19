import { MappingPair, Profile } from '@dynamic-mapper/mapper';
import * as _ from 'lodash';

import { PaymentOperationEntity } from '../entities/payment-operation.entity';
import { PaymentOperationModel } from '../../../../domain/models/accounting/payment-operation.model';

export class PaymentOperationsMappingProfile extends Profile {
	static readonly PaymentOperaionEntityToDomain = new MappingPair<PaymentOperationEntity, PaymentOperationModel>();
}
