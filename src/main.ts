import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import * as Sentry from '@sentry/angular';

import { loadAppSettings } from './app-settings';
import { AppBootstrapModule } from './app/modules/app-bootstrap/app-bootstrap.module';
import { environment } from './environments/environment';
import { initializeBrowserTracing } from './infrastructure/browser-telemetry';

if (environment.production) {
	enableProdMode();
}

void loadAppSettings()
	.then(settings => {
		if (settings?.sentryDns) {
			Sentry.init({
				dsn: settings.sentryDns,
				integrations: [Sentry.replayIntegration()],
				replaysSessionSampleRate: 0.1,
				replaysOnErrorSampleRate: 1.0,
				environment: environment.production ? 'production' : 'development',
			});
		}

		initializeBrowserTracing(settings);

		return platformBrowserDynamic().bootstrapModule(AppBootstrapModule);
	})
	.catch(err => console.error(err));
