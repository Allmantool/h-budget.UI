import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';

const coreModules = [CommonModule, RouterOutlet, RouterLink, HttpClientModule];

@NgModule({
	declarations: [],
	exports: [coreModules],
	imports: [coreModules],
	providers: [],
	bootstrap: [],
})
export class AppCoreModule {}
