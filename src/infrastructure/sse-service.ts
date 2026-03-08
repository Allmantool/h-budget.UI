import { Injectable, NgZone } from '@angular/core';
import { Subject, timer, take } from 'rxjs';
import { AccountNotification } from './account-notification';
import { AppConfigurationService } from 'app/modules/shared/services/app-configuration.service';

@Injectable({ providedIn: 'root' })
export class SseService {

  private accountingHostUrl?: string;
  private eventSource?: EventSource;
  private sseUrl?: string;

  private reconnectDelay = 1000;
  private readonly maxReconnectDelay = 30000;

  private lastEventId?: string;

  private notificationSubject = new Subject<AccountNotification>();
  public notifications$ = this.notificationSubject.asObservable();

  constructor(
    private readonly ngZone: NgZone,
    private readonly appConfigurationService: AppConfigurationService
  ) {
    this.accountingHostUrl = this.appConfigurationService.settings?.gatewayHost;
  }

  public connect(url: string): void {

    if (this.eventSource) {
      return;
    }

    this.sseUrl = `${this.accountingHostUrl}/${url}`;

    this.ngZone.runOutsideAngular(() => this.setupEventSource());
  }

  private setupEventSource() {

    if (!this.sseUrl) return;

    const url = this.lastEventId
      ? `${this.sseUrl}?lastEventId=${this.lastEventId}`
      : this.sseUrl;

    this.eventSource = new EventSource(url);

    this.eventSource.onmessage = (event) => {

      try {

        if (!event.data) return;

        this.lastEventId = event.lastEventId;

        const data: AccountNotification = JSON.parse(event.data);

        this.ngZone.run(() => this.notificationSubject.next(data));

      } catch {
        console.warn("Invalid SSE data", event.data);
      }
    };

    this.eventSource.addEventListener("heartbeat", () => {
      console.debug("heartbeat received");
    });

    this.eventSource.onopen = () => {
      this.reconnectDelay = 1000;
      console.debug("SSE connected");
    };

    this.eventSource.onerror = () => {

      if (this.eventSource?.readyState === EventSource.CLOSED) {

        console.warn("SSE connection lost. Reconnecting...");

        const delay = this.reconnectDelay;

        this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxReconnectDelay);

        timer(delay).pipe(take(1)).subscribe(() => {
          this.disconnect();
          this.setupEventSource();
        });
      }
    };
  }

  public disconnect() {
    this.eventSource?.close();
    this.eventSource = undefined;
  }
}