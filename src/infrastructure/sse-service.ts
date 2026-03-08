import { Injectable, NgZone } from '@angular/core';
import { Subject, Observable, timer } from 'rxjs';
import { AccountNotification } from './account-notification';


@Injectable({ providedIn: 'root' })
export class SseService {
  private eventSource?: EventSource;
  private reconnectDelay = 1000; // start with 1s
  private readonly maxReconnectDelay = 30000; // max 30s

  private notificationSubject = new Subject<AccountNotification>();
  public notifications$: Observable<AccountNotification> = this.notificationSubject.asObservable();

  constructor(private ngZone: NgZone) { }

  public connect(url: string): void {
    this.ngZone.runOutsideAngular(() => this.setupEventSource(url));
  }

  private setupEventSource(url: string) {
    this.eventSource = new EventSource(url);

    this.eventSource.onmessage = (event) => {
      try {
        if (event.data) {
          const data: AccountNotification = JSON.parse(event.data);
          this.ngZone.run(() => this.notificationSubject.next(data));
        }
      } catch {
        console.warn("Invalid SSE data", event.data);
      }
    };

    this.eventSource.addEventListener("heartbeat", () => {
      console.debug("heartbeat received");
    });

    this.eventSource.onerror = () => {
      console.warn("SSE connection lost, attempting reconnect...");
      this.eventSource?.close();

      const delay = this.reconnectDelay;
      this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxReconnectDelay);

      timer(delay).subscribe(() => this.setupEventSource(url));
    };

    this.eventSource.onopen = () => {
      this.reconnectDelay = 1000;
      console.debug("SSE connected");
    };
  }

  public disconnect() {
    this.eventSource?.close();
    this.eventSource = undefined;
  }
}