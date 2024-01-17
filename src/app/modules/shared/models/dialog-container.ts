import { Observable } from 'rxjs';

import { DialogOperationTypes } from './dialog-operation-types';

export class DialogContainer<T, U> {
	title!: string;
	operationType?: DialogOperationTypes;
	onSubmit!: (payload: T) => Observable<U>;
}
