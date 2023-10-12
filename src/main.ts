import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { environment } from './environments/environment';
import { AppBootsrapModule } from './app/modules/app-boostrap/app-bootsrap.module';

if (environment.production) {
	enableProdMode();
}

platformBrowserDynamic()
	.bootstrapModule(AppBootsrapModule)
	.catch((err) => console.error(err));
