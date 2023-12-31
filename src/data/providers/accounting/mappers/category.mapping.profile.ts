import * as _ from 'lodash';

import { MappingPair, Profile } from '@dynamic-mapper/mapper';
import { Guid } from 'typescript-guid';

import { ICategoryModel } from '../../../../domain/models/accounting/category.model';
import { ICategoryEntity } from '../entities/operation-category.entity';

export class DataCategoryProfile extends Profile {
	static readonly CategoryEntityToDomain = new MappingPair<ICategoryEntity, ICategoryModel>();

	constructor() {
		super();

		this.createMap(DataCategoryProfile.CategoryEntityToDomain, {
			key: opt => {
				opt.preCondition(src => !_.isNil(src.key));
				opt.mapFrom(src => Guid.parse(src.key));
			},
			operationType: opt => {
				opt.preCondition(src => !_.isNil(src.categoryType));
				opt.mapFrom(src => src.categoryType);
			},
			nameNodes: opt => {
				opt.preCondition(src => !_.isNil(src.nameNodes));
				opt.mapFrom(src => src.nameNodes);
			},
		});
	}
}
