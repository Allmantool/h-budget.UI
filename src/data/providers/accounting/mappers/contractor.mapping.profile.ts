import * as _ from 'lodash';

import { MappingPair, Profile } from '@dynamic-mapper/mapper';
import { Guid } from 'typescript-guid';

import { IContractorModel } from '../../../../domain/models/accounting/contractor.model.';
import { IContractorEntity } from '../entities/contractor.entity';

export class DataContractorProfile extends Profile {
	static readonly ContractorEntityToDomain = new MappingPair<IContractorEntity, IContractorModel>();

	constructor() {
		super();

		this.createMap(DataContractorProfile.ContractorEntityToDomain, {
			key: opt => {
				opt.preCondition(src => !_.isNil(src.key));
				opt.mapFrom(src => Guid.parse(src.key));
			},
			nameNodes: opt => {
				opt.preCondition(src => !_.isNil(src.nameNodes));
				opt.mapFrom(src => src.nameNodes);
			},
		});
	}
}
