import { Injectable, NgZone } from '@angular/core';
import { AppConfigurationService } from 'app/modules/shared/services/app-configuration.service';

import { Subject, Subscription, take, timer } from 'rxjs';

import { HttpTransportType, HubConnection, HubConnectionBuilder, HubConnectionState } from '@microsoft/signalr';

import { AccountNotification } from './account-notification';

@Injectable({ providedIn: 'root' })
export class SseService {
	private connection?: HubConnection;

	private readonly reconnectDelaysMs = [1_000, 2_000, 5_000, 10_000, 30_000] as const;
	private reconnectAttempt = 0;
	private reconnectSubscription?: Subscription;

	private notificationSubject = new Subject<AccountNotification>();
	public notifications$ = this.notificationSubject.asObservable();

	constructor(
		private readonly ngZone: NgZone,
		private readonly appConfigurationService: AppConfigurationService
	) {}

	public connect(url: string): void {
		if (this.connection) {
			return;
		}

		const gatewayHost = this.appConfigurationService.settings?.gatewayHost;

		if (!gatewayHost) {
			console.warn('SignalR gateway host is not configured');
			return;
		}

		const hubUrl = `${gatewayHost}/${url}`;

		this.connection = new HubConnectionBuilder()
			.withUrl(hubUrl, {
				skipNegotiation: true,
				transport: HttpTransportType.WebSockets,
			})
			.withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
			.build();

		this.registerHandlers(this.connection);

		this.ngZone.runOutsideAngular(() => {
			void this.startConnection(this.connection!);
		});
	}

	public disconnect(): void {
		const activeConnection = this.connection;

		this.connection = undefined;
		this.resetReconnectState();

		if (!activeConnection) {
			return;
		}

		void activeConnection.stop();
	}

	private registerHandlers(connection: HubConnection): void {
		connection.on('ReceiveAccountNotification', (payload: AccountNotification | string) =>
			this.handleNotificationEvent(payload)
		);

		connection.onreconnecting(() => {
			this.resetReconnectState();
		});

		connection.onreconnected(() => {
			this.resetReconnectState();
		});

		connection.onclose(() => {
			if (this.connection !== connection) {
				return;
			}

			this.connection = undefined;
			this.resetReconnectState();
			console.warn('SignalR connection closed after bounded reconnect attempts.');
		});
	}

	private async startConnection(connection: HubConnection): Promise<void> {
		if (this.connection !== connection || connection.state !== HubConnectionState.Disconnected) {
			return;
		}

		try {
			await connection.start();
			this.resetReconnectState();
		} catch {
			this.scheduleInitialReconnect(connection);
		}
	}

	private scheduleInitialReconnect(connection: HubConnection): void {
		const delay = this.reconnectDelaysMs[this.reconnectAttempt];
		if (delay === undefined) {
			this.connection = undefined;
			console.warn('SignalR connection could not be established after bounded retry attempts.');
			return;
		}

		this.reconnectAttempt++;
		this.reconnectSubscription = timer(delay)
			.pipe(take(1))
			.subscribe(() => {
				this.reconnectSubscription = undefined;
				if (this.connection !== connection) {
					return;
				}

				void this.startConnection(connection);
			});
	}

	private resetReconnectState(): void {
		this.reconnectAttempt = 0;
		this.reconnectSubscription?.unsubscribe();
		this.reconnectSubscription = undefined;
	}

	private handleNotificationEvent(payload: AccountNotification | string): void {
		try {
			if (!payload) {
				return;
			}

			const data = this.parseNotification(payload);

			this.ngZone.run(() => this.notificationSubject.next(data));
		} catch {
			console.warn('Invalid SignalR data', payload);
		}
	}

	private parseNotification(payload: AccountNotification | string): AccountNotification {
		return typeof payload === 'string' ? (JSON.parse(payload) as AccountNotification) : payload;
	}
}
