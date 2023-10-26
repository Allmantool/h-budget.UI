import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { APP_INITIALIZER, NgModule } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { BrowserModule } from '@angular/platform-browser';

import { NgxsModule } from '@ngxs/store';
import { NgxsLoggerPluginModule } from '@ngxs/logger-plugin';
import { NgxsReduxDevtoolsPluginModule } from '@ngxs/devtools-plugin';

import { AppSharedModule } from './../shared/shared.module';
import { ngxsConfig } from './../shared/store/ngxs.config';
import { CorrelationIdInteceptor } from '../core/interceptors/correlation-id.interceptor';
import { HttpRequestLoaderInterceptor } from '../core/interceptors/http-request-loader.interceptor';
import { CoreAppState } from '../shared/store/states/core-app-root/core-app.state';
import { AppBootsrapRoutingModule } from './app-bootsrap-routing.module';
import { AppRootComponent } from './components/app-root/app-root.component';
import { CustomUIComponentsSharedModule } from '../shared/custom-ui-components.shared.module';
import { AppCoreModule } from '../core';

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
		[
			{
				provider: APP_INITIALIZER,
				useFactory: () => {
					return () =>
						new Promise(resolve => {
							console.log('hey there');
							/* const settings = require('../../../../../UI/config.json');*/
							resolve(true);
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
	],
	bootstrap: [AppRootComponent],
})
export class AppBootsrapModule {}
