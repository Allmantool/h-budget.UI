import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { APP_INITIALIZER, ErrorHandler, inject, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { NgxsReduxDevtoolsPluginModule } from '@ngxs/devtools-plugin';
import { NgxsLoggerPluginModule } from '@ngxs/logger-plugin';
import { NgxsModule } from '@ngxs/store';

import * as Sentry from '@sentry/angular';
import { environment } from 'environments/environment';

import { loadAppSettings } from '../../../app-settings';
import { BootstrapRoutingModule } from './app-bootstrap-routing.module';
import { AppCoreModule } from '../core';
import { CorrelationIdInterceptor } from '../core/interceptors/correlation-id.interceptor';
import { HttpRequestLoaderInterceptor } from '../core/interceptors/http-request-loader.interceptor';
import { AngularMaterialSharedModule } from '../shared/angular-material.shared.module';
import { CustomUIComponentsSharedModule } from '../shared/custom-ui-components.shared.module';
import { AppConfigurationService } from '../shared/services/app-configuration.service';
import { AppSharedModule } from '../shared/shared.module';
import { BaseLayoutComponent } from './components/base-layout/base-layout.component';
import { ngxsConfig } from '../shared/store/ngxs.config';
import { CoreAppState } from '../shared/store/states/core/core-app.state';

@NgModule({
	declarations: [BaseLayoutComponent],
	imports: [
		NgxsModule.forRoot([CoreAppState], ngxsConfig),
		NgxsLoggerPluginModule.forRoot(),
		!environment.production ? NgxsReduxDevtoolsPluginModule.forRoot() : [],
		AppSharedModule,
		CustomUIComponentsSharedModule,
		AppCoreModule,
		BootstrapRoutingModule,
		BrowserModule,
		AngularMaterialSharedModule,
		BrowserAnimationsModule,
	],
	providers: [
		{
			provide: APP_INITIALIZER,
			useFactory: () => {
				const appConfigurationService = inject(AppConfigurationService);

				return () =>
					loadAppSettings().then(appSettings => {
						appConfigurationService.settings = appSettings;

						if (appSettings) {
							console.log(`App settings: ${JSON.stringify(appConfigurationService.settings)}`);
						}

						return true;
					});
			},
			multi: true,
		},
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
		{
			provide: ErrorHandler,
			useValue: Sentry.createErrorHandler(),
		},
	],
	bootstrap: [BaseLayoutComponent],
})
export class AppBootstrapModule {}
