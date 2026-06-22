import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { init, replayIntegration } from '@sentry/angular';

import { AppBootstrapModule } from './app/modules/app-bootstrap/app-bootstrap.module';
import { loadAppSettings } from './app-settings';
import { IAppSettingsModel } from './domain/models/app-settings.model';
import { environment } from './environments/environment';
import { initializeBrowserTracing } from './infrastructure/browser-telemetry';

export type SentryBootstrapSettings = IAppSettingsModel & {
	readonly sentryDns: string;
};

export interface ApplicationBootstrapDependencies {
	readonly loadSettings: () => Promise<IAppSettingsModel | undefined>;
	readonly shouldInitializeSentry: (settings: IAppSettingsModel | undefined) => settings is SentryBootstrapSettings;
	readonly initializeSentry: (settings: SentryBootstrapSettings) => void;
	readonly initializeTracing: (settings: IAppSettingsModel | undefined) => void;
	readonly bootstrapAngular: () => Promise<unknown>;
	readonly handleBootstrapError: (error: unknown) => void;
}

export function runApplicationBootstrap(dependencies: ApplicationBootstrapDependencies): Promise<unknown> {
	return dependencies
		.loadSettings()
		.then(settings => {
			if (dependencies.shouldInitializeSentry(settings)) {
				dependencies.initializeSentry(settings);
			}

			dependencies.initializeTracing(settings);

			return dependencies.bootstrapAngular();
		})
		.catch(error => dependencies.handleBootstrapError(error));
}

export function createProductionBootstrapDependencies(): ApplicationBootstrapDependencies {
	return {
		loadSettings: loadAppSettings,
		shouldInitializeSentry: shouldInitializeSentryFromSettings,
		initializeSentry: initializeSentryForSettings,
		initializeTracing: initializeBrowserTracing,
		bootstrapAngular: bootstrapNgModuleApplication,
		handleBootstrapError,
	};
}

export function shouldInitializeSentryFromSettings(
	settings: IAppSettingsModel | undefined
): settings is SentryBootstrapSettings {
	return Boolean(settings?.sentryDns);
}

export function initializeSentryForSettings(settings: SentryBootstrapSettings): void {
	init({
		dsn: settings.sentryDns,
		integrations: [replayIntegration()],
		replaysSessionSampleRate: 0.1,
		replaysOnErrorSampleRate: 1.0,
		environment: environment.production ? 'production' : 'development',
	});
}

export function bootstrapNgModuleApplication(): Promise<unknown> {
	return platformBrowserDynamic().bootstrapModule(AppBootstrapModule);
}

export function handleBootstrapError(error: unknown): void {
	console.error(error);
}
