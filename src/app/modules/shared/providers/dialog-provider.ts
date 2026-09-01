import { ComponentType } from '@angular/cdk/portal';
import { Injectable, TemplateRef } from '@angular/core';
import { MatDialog, MatDialogConfig, MatDialogRef } from '@angular/material/dialog';

@Injectable()
export class DialogProvider {
	constructor(public dialog: MatDialog) {}

	openDialog<T, D>(componentRef: ComponentType<T> | TemplateRef<T>, сonfig?: MatDialogConfig<D>): MatDialogRef<T> {
		const defaultConfig = new MatDialogConfig();
		defaultConfig.autoFocus = true;
		defaultConfig.disableClose = true;

		return this.dialog.open(componentRef, { ...defaultConfig, ...сonfig });
	}
}
