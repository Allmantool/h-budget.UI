import * as _ from 'lodash';

import { MappingPair, Profile } from '@dynamic-mapper/mapper';

import { Guid } from 'typescript-guid';

import { ContractorModel } from '../../../../domain/models/accounting/contractor.model.';
import { ContractorEntity } from '../entities/contractor.entity';

export class DataContractorProfile extends Profile {
	static readonly ContractorEntityToDomain = new MappingPair<ContractorEntity, ContractorModel>();

	constructor() {
		super();

		this.createMap(DataContractorProfile.ContractorEntityToDomain, {
			id: opt => {
				opt.preCondition(src => !_.isNil(src.id));
				opt.mapFrom(src => Guid.parse(src.id.toString()));
			},
			nameNodes: opt => {
				opt.preCondition(src => !_.isNil(src.nameNodes));
				opt.mapFrom(src => src.nameNodes);
			},
		});
	}
}
