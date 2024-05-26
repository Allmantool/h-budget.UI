import * as _ from 'lodash';

import { MappingPair, Profile } from '@dynamic-mapper/mapper';
import { format } from 'date-fns';
import { Guid } from 'typescript-guid';

import { DateFormats } from '../../../../app/modules/shared/constants/date-formats';
import { IPaymentOperationModel } from '../../../../domain/models/accounting/payment-operation.model';
import { IPaymentOperationCreateOrUpdateRequest } from '../../../../domain/models/accounting/requests/payment-operation-create-or-update.request';
import { OperationTypes } from '../../../../domain/types/operation.types';
import { IPaymentOperationEntity } from '../entities/payment-operation.entity';

export class PaymentOperationsMappingProfile extends Profile {
	static readonly PaymentOperationEntityToDomain = new MappingPair<IPaymentOperationEntity, IPaymentOperationModel>();

	static readonly DomainToPaymentOperationSaveRequest = new MappingPair<
		IPaymentOperationModel,
		IPaymentOperationCreateOrUpdateRequest
	>();

	constructor() {
		super();

		this.createMap(PaymentOperationsMappingProfile.DomainToPaymentOperationSaveRequest, {
			amount: opt => {
				opt.preCondition(src => !_.isNil(src.amount));
				opt.mapFrom(src => src.amount);
			},
			comment: opt => {
				opt.preCondition(src => !_.isNil(src.amount));
				opt.mapFrom(src => src.comment);
			},
			contractorId: opt => {
				opt.preCondition(src => !_.isNil(src.contractorId));
				opt.mapFrom(src => src.contractorId.toString());
			},
			operationDate: opt => {
				opt.preCondition(src => !_.isNil(src.operationDate));
				opt.mapFrom(src => format(src.operationDate, DateFormats.ApiRequest));
			},
			categoryId: opt => {
				opt.preCondition(src => !_.isNil(src.categoryId));
				opt.mapFrom(src => src.categoryId.toString());
			},
		});

		this.createMap(PaymentOperationsMappingProfile.PaymentOperationEntityToDomain, {
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
			amount: opt => {
				opt.preCondition(src => !_.isNil(src.amount));
				opt.mapFrom(src => src.amount);
			},
			operationDate: opt => {
				opt.preCondition(src => !_.isNil(src.operationDay));
				opt.mapFrom(src => new Date(src.operationDay));
			},
			operationType: opt => {
				opt.preCondition(src => !_.isNil(src.transactionType));
				opt.mapFrom(src => src.transactionType as OperationTypes);
			},
		});
	}
}
