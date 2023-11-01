import { Injectable } from '@angular/core';

import { AppSettingsModel } from '../../../../domain/models/app-settings.model';

@Injectable({
	providedIn: 'root',
})
export class AppConfigurationService {
	settings: AppSettingsModel | undefined;
}
