import { enableProdMode } from '@angular/core';

import { createProductionBootstrapDependencies, runApplicationBootstrap } from './application-bootstrap';
import { environment } from './environments/environment';

if (environment.production) {
	enableProdMode();
}

void runApplicationBootstrap(createProductionBootstrapDependencies());
