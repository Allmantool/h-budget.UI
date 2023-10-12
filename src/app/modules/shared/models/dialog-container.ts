import { Observable } from 'rxjs';

export class DialogContainer {
	title!: string;
	onSubmit!: <T>(payload: T) => Observable<T>;
}
