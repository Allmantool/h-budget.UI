import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { RouterOutlet } from '@angular/router';

const coreModules = [CommonModule, RouterOutlet, HttpClientModule];

@NgModule({
	declarations: [],
	exports: [coreModules],
	imports: [coreModules],
	providers: [],
	bootstrap: [],
})
export class AppCoreModule {}
