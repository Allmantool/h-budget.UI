export interface Notification {
	id: string;
	type: 'success' | 'error' | 'info' | 'warning';
	message: string;
}
