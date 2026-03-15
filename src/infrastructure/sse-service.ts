import { Injectable, NgZone } from '@angular/core';

import { HubConnection, HubConnectionBuilder, HubConnectionState, HttpTransportType } from '@microsoft/signalr';
import { Subject, take, timer } from 'rxjs';

import { AppConfigurationService } from 'app/modules/shared/services/app-configuration.service';

import { AccountNotification } from './account-notification';

@Injectable({ providedIn: 'root' })
export class SseService {
	private connection?: HubConnection;

	private reconnectDelay = 1000;
	private readonly maxReconnectDelay = 30000;

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
		this.reconnectDelay = 1000;

		if (!activeConnection) {
			return;
		}

		void activeConnection.stop();
	}

	private registerHandlers(connection: HubConnection): void {
		connection.on('ReceiveAccountNotification', payload => this.handleNotificationEvent(payload));

		connection.onreconnecting(() => {
			console.warn('SignalR connection lost. Waiting for reconnect...');
		});

		connection.onreconnected(() => {
			this.reconnectDelay = 1000;
			console.debug('SignalR reconnected');
		});

		connection.onclose(() => {
			if (this.connection !== connection) {
				return;
			}

			console.warn('SignalR connection closed. Reconnecting...');
			this.scheduleReconnect(connection);
		});
	}

	private async startConnection(connection: HubConnection): Promise<void> {
		if (this.connection !== connection || connection.state !== HubConnectionState.Disconnected) {
			return;
		}

		try {
			await connection.start();
			this.reconnectDelay = 1000;
			console.debug('SignalR connected');
		} catch (error) {
			console.warn('SignalR connection failed. Reconnecting...', error);
			this.scheduleReconnect(connection);
		}
	}

	private scheduleReconnect(connection: HubConnection): void {
		const delay = this.reconnectDelay;

		this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxReconnectDelay);

		timer(delay)
			.pipe(take(1))
			.subscribe(() => {
				if (this.connection !== connection) {
					return;
				}

				void this.startConnection(connection);
			});
	}

	private handleNotificationEvent(payload: AccountNotification | string): void {
		try {
			if (!payload) {
				return;
			}

			const data: AccountNotification = typeof payload === 'string' ? JSON.parse(payload) : payload;

			this.ngZone.run(() => this.notificationSubject.next(data));
		} catch {
			console.warn('Invalid SignalR data', payload);
		}
	}
}
