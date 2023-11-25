import { Injectable } from '@angular/core';

import { State } from '@ngxs/store';

import { CategoriesState } from './categories.state';
import { CounterpartiesState } from './counterparties.state';
import { IHandbooksStateModel } from './models/IHandbooksStateModel';

@State<IHandbooksStateModel>({
	name: 'handbooks',
	defaults: {},
	children: [CategoriesState, CounterpartiesState],
})
@Injectable()
export class HandbbooksState {}
