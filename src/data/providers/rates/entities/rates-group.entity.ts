import { RateValueEntity } from './rate-value.entity';

export interface RatesGroupEntity {
	currencyId?: number;
	name?: string;
	abbreviation?: string;
	scale?: number;
	rateValues?: RateValueEntity[];
}
