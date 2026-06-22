/// <reference types="node" />

import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import {
	EnvironmentProviders,
	ErrorHandler,
	importProvidersFrom,
	inject,
	provideAppInitializer,
	Provider,
} from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { PreloadAllModules, provideRouter, withPreloading } from '@angular/router';

import { NgxsReduxDevtoolsPluginModule } from '@ngxs/devtools-plugin';
import { NgxsLoggerPluginModule } from '@ngxs/logger-plugin';
import { NgxsModule } from '@ngxs/store';

import * as Sentry from '@sentry/angular';

import { appRoutes } from '../../../app/modules/app-bootstrap/app-bootstrap-routing.module';
import { CorrelationIdInterceptor } from '../../../app/modules/core/interceptors/correlation-id.interceptor';
import { HttpRequestLoaderInterceptor } from '../../../app/modules/core/interceptors/http-request-loader.interceptor';
import { AppConfigurationService } from '../../../app/modules/shared/services/app-configuration.service';
import { ngxsConfig } from '../../../app/modules/shared/store/ngxs.config';
import { CoreAppState } from '../../../app/modules/shared/store/states/core/core-app.state';
import { loadAppSettings } from '../../../app-settings';
import { IAppSettingsModel } from '../../../domain/models/app-settings.model';

export type RootSettingsLoader = () => Promise<IAppSettingsModel | undefined>;

export interface RootProviderTestOptions {
	readonly production: boolean;
	readonly includeAnimations?: boolean;
	readonly loadSettings?: RootSettingsLoader;
	readonly createErrorHandler?: () => ErrorHandler;
}

export function createStandaloneRootTestProviders(
	options: RootProviderTestOptions
): Array<Provider | EnvironmentProviders> {
	const providers: Array<Provider | EnvironmentProviders> = [
		provideRouter(appRoutes, withPreloading(PreloadAllModules)),
		provideHttpClient(withInterceptorsFromDi()),
		{
			provide: HTTP_INTERCEPTORS,
			useClass: CorrelationIdInterceptor,
			multi: true,
		},
		{
			provide: HTTP_INTERCEPTORS,
			useClass: HttpRequestLoaderInterceptor,
			multi: true,
		},
		importProvidersFrom(
			NgxsModule.forRoot([CoreAppState], ngxsConfig),
			NgxsLoggerPluginModule.forRoot(),
			...(options.production ? [] : [NgxsReduxDevtoolsPluginModule.forRoot()])
		),
		provideAppInitializer(() => initializeStandaloneRootSettings(options.loadSettings ?? loadAppSettings)),
		{
			provide: ErrorHandler,
			useFactory: options.createErrorHandler ?? (() => Sentry.createErrorHandler()),
		},
	];

	if (options.includeAnimations !== false) {
		providers.push(provideAnimations());
	}

	return providers;
}

export function initializeStandaloneRootSettings(loadSettings: RootSettingsLoader = loadAppSettings): Promise<true> {
	const appConfigurationService = inject(AppConfigurationService);

	return loadSettings().then(appSettings => {
		appConfigurationService.settings = appSettings;

		return true;
	});
}
