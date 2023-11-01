import { HTTP_INTERCEPTORS, HttpClient } from '@angular/common/http';
import { APP_INITIALIZER, NgModule, inject } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { BrowserModule } from '@angular/platform-browser';

import { NgxsModule } from '@ngxs/store';
import { NgxsLoggerPluginModule } from '@ngxs/logger-plugin';
import { NgxsReduxDevtoolsPluginModule } from '@ngxs/devtools-plugin';
import { tap, of, take, catchError } from 'rxjs';

import { AppSharedModule } from './../shared/shared.module';
import { ngxsConfig } from './../shared/store/ngxs.config';
import { CorrelationIdInteceptor } from '../core/interceptors/correlation-id.interceptor';
import { HttpRequestLoaderInterceptor } from '../core/interceptors/http-request-loader.interceptor';
import { CoreAppState } from '../shared/store/states/core-app-root/core-app.state';
import { AppBootsrapRoutingModule } from './app-bootsrap-routing.module';
import { AppRootComponent } from './components/app-root/app-root.component';
import { CustomUIComponentsSharedModule } from '../shared/custom-ui-components.shared.module';
import { AppCoreModule } from '../core';
import { AppSettingsModel } from 'domain/models/app-settings.model';
import { AppConfigurationService } from '../shared/services/app-configuration.service';
import { environment } from 'environments/environment';

@NgModule({
	declarations: [AppRootComponent],
	imports: [
		NgxsModule.forRoot([CoreAppState], ngxsConfig),
		NgxsLoggerPluginModule.forRoot(),
		NgxsReduxDevtoolsPluginModule.forRoot(),
		AppSharedModule,
		CustomUIComponentsSharedModule,
		AppCoreModule,
		AppBootsrapRoutingModule,
		BrowserModule,
		BrowserAnimationsModule,
	],
	providers: [
		{
			provide: APP_INITIALIZER,
			useFactory: () => {
				const appConfigurationService = inject(AppConfigurationService);
				const httpClient = inject(HttpClient);

				return () =>
					new Promise(resolve => {
						if (environment.production) {
							httpClient
								.get('./config.json')
								.pipe(
									take(1),
									tap(appSettings => {
										appConfigurationService.settings = appSettings as AppSettingsModel;
										resolve(true);
									}),
									catchError(() => {
										appConfigurationService.settings = undefined;
										return of(null);
									})
								)
								.subscribe();
						} else {
							const appSettings: AppSettingsModel = required('../../../../../UI/config.json');
							appConfigurationService.settings = appSettings;

							resolve(true);
						}
					});
			},
			multi: true,
		},
		{
			provide: HTTP_INTERCEPTORS,
			useClass: CorrelationIdInteceptor,
			multi: true,
		},
		{
			provide: HTTP_INTERCEPTORS,
			useClass: HttpRequestLoaderInterceptor,
			multi: true,
		},
	],
	bootstrap: [AppRootComponent],
})
export class AppBootsrapModule {}
