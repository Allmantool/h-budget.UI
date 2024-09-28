import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppBootstrapModule } from './app/modules/app-bootstrap/app-bootstrap.module';
import { environment } from './environments/environment';

if (environment.production) {
	enableProdMode();
}

platformBrowserDynamic()
	.bootstrapModule(AppBootstrapModule)
	.catch(err => console.error(err));
