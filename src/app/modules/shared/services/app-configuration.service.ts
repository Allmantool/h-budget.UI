import { Injectable } from '@angular/core';

import { IAppSettingsModel } from '../../../../domain/models/app-settings.model';

@Injectable({
	providedIn: 'root',
})
export class AppConfigurationService {
	settings: IAppSettingsModel | undefined;
}
