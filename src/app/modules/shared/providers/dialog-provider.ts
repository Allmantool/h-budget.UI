import { ComponentType } from '@angular/cdk/portal';
import { Injectable, TemplateRef } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';

import * as _ from 'lodash';

@Injectable({
	providedIn: 'root',
})
export class DialogProvider {
	constructor(public dialog: MatDialog) {}

	openDialog<T, D>(
		componentRef: ComponentType<T> | TemplateRef<T>,
		сonfig?: MatDialogConfig<D>
	): void {
		const defaultConfig = new MatDialogConfig();
		defaultConfig.autoFocus = true;
		defaultConfig.disableClose = true;

		this.dialog.open(componentRef, { ...defaultConfig, ...сonfig });
	}
}
