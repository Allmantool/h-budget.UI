import { Observable } from 'rxjs';

import { DialogOperationTypes } from './dialog-operation-types';

export class DialogContainer<T, U> {
	title!: string;
	operationType?: DialogOperationTypes | undefined;
	onSubmit!: (payload: T) => Observable<U>;
}
