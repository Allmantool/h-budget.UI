/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { HTTP_INTERCEPTORS, HttpClient } from '@angular/common/http';
import { APP_INITIALIZER, inject, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { NgxsReduxDevtoolsPluginModule } from '@ngxs/devtools-plugin';
import { NgxsLoggerPluginModule } from '@ngxs/logger-plugin';
import { NgxsModule } from '@ngxs/store';
import { catchError, of, take, tap } from 'rxjs';

import { environment } from 'environments/environment';

import { BootstrapRoutingModule } from './app-bootstrap-routing.module';
import { IAppSettingsModel } from '../../../domain/models/app-settings.model';
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
				const httpClient = inject(HttpClient);

				return () =>
					new Promise(resolve => {
						if (environment.production) {
							httpClient
								.get('assets/config.json')
								.pipe(
									take(1),
									tap(appSettings => {
										appConfigurationService.settings = appSettings as IAppSettingsModel;
										console.log(
											`Prod settings is: ${JSON.stringify(appConfigurationService.settings)}`
										);

										resolve(true);
									}),
									catchError(err => {
										appConfigurationService.settings = undefined;

										console.error(`Prod bootstrap error: ${JSON.stringify(err)}`);

										return of(null);
									})
								)
								.subscribe();
						} else {
							const appSettings: IAppSettingsModel = require('/src/assets/config.json');
							appConfigurationService.settings = appSettings;

							resolve(true);
						}
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
	],
	bootstrap: [BaseLayoutComponent],
})
export class AppBootstrapModule {}
