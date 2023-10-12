import { Injectable } from '@angular/core';

import { State } from '@ngxs/store';

import { IHandbooksStateModel } from './models/IHandbooksStateModel';
import { CategoriesState } from './categories.state';
import { CounterpartiesState } from './counterparties.state';

@State<IHandbooksStateModel>({
	name: 'handbooks',
	defaults: {},
	children: [CategoriesState, CounterpartiesState],
})
@Injectable()
export class HandbbooksState {}
