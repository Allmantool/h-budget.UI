import { Injectable } from '@angular/core';

import { State } from '@ngxs/store';

import { CategoriesState } from './categories.state';
import { ContractorsState } from './contractors.state';
import { IHandbooksStateModel } from './models/IHandbooksStateModel';

@State<IHandbooksStateModel>({
	name: 'handbooks',
	defaults: {},
	children: [CategoriesState, ContractorsState],
})
@Injectable()
export class HandbooksState {}
