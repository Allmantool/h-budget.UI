import { Observable } from 'rxjs';

export interface IAccountsService {
	refreshAccounts(paymentAccountId: string): Observable<void>;
}
