import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { NgxsModule } from '@ngxs/store';
import { NgxsLoggerPluginModule } from '@ngxs/logger-plugin';
import { NgxsReduxDevtoolsPluginModule } from '@ngxs/devtools-plugin';

import { AppBootsrapRoutingModule, AppRootComponent } from '../app-boostrap';
import { AppSharedModule } from './../shared/shared.module';
import { ngxsConfig } from './../shared/store/ngxs.config';
import { CorrelationIdInteceptor } from '../core/interceptors/correlation-id.interceptor';

@NgModule({
	declarations: [AppRootComponent],
	imports: [
		NgxsModule.forRoot([], ngxsConfig),
		NgxsLoggerPluginModule.forRoot(),
		NgxsReduxDevtoolsPluginModule.forRoot(),
		AppSharedModule,
		CommonModule,
		HttpClientModule,
		BrowserModule,
		BrowserAnimationsModule,
		AppBootsrapRoutingModule,
		RouterOutlet,
	],
	providers: [
		[
			{
				provide: HTTP_INTERCEPTORS,
				useClass: CorrelationIdInteceptor,
				multi: true,
			},
		],
	],
	bootstrap: [AppRootComponent],
})
export class AppBootsrapModule {}
