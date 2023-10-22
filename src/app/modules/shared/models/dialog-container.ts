import { Observable } from 'rxjs';

import { DialogOperationTypes } from './dialog-operation-types';

export class DialogContainer {
	title!: string;
	onSubmit!: <T>(payload: T) => Observable<T>;
	operationType?: DialogOperationTypes | undefined;
}
