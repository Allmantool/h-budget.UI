import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import * as Sentry from "@sentry/angular";
import { Integrations } from '@sentry/tracing';

import { AppBootstrapModule } from './app/modules/app-bootstrap/app-bootstrap.module';
import { environment } from './environments/environment';

if (environment.production) {
	enableProdMode();
}

Sentry.init({
  dsn: "",
  integrations: [
    Sentry.replayIntegration(),
  ],
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
	environment: environment.production ? 'production' : 'development',
});

platformBrowserDynamic()
	.bootstrapModule(AppBootstrapModule)
	.catch(err => console.error(err));
