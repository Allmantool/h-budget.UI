import developmentAppSettings from './assets/config.json';
import { IAppSettingsModel } from './domain/models/app-settings.model';
import { environment } from './environments/environment';

let appSettingsPromise: Promise<IAppSettingsModel | undefined> | undefined;

export function loadAppSettings(): Promise<IAppSettingsModel | undefined> {
	appSettingsPromise ??= environment.production
		? fetch('assets/config.json')
				.then(async response => {
					if (!response.ok) {
						throw new Error(`Settings request failed with status ${response.status}`);
					}

					return (await response.json()) as IAppSettingsModel;
				})
				.catch(error => {
					console.error('Failed to load app settings', error);
					return undefined;
				})
		: Promise.resolve(developmentAppSettings as IAppSettingsModel);

	return appSettingsPromise;
}
