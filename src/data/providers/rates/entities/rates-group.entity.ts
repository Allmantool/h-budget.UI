import { IRateValueEntity } from './rate-value.entity';

export interface IRatesGroupEntity {
	currencyId?: number;
	name?: string;
	abbreviation?: string;
	scale?: number;
	rateValues?: IRateValueEntity[];
}
