import { ComponentType } from '@angular/cdk/portal';
import { Injectable, TemplateRef } from '@angular/core';
import { MatDialog, MatDialogConfig, MatDialogRef } from '@angular/material/dialog';

@Injectable()
export class DialogProvider {
	constructor(public dialog: MatDialog) {}

	openDialog<T, D, R = unknown>(
		componentRef: ComponentType<T> | TemplateRef<T>,
		сonfig?: MatDialogConfig<D>
	): MatDialogRef<T, R> {
		const defaultConfig = new MatDialogConfig();
		defaultConfig.autoFocus = true;
		defaultConfig.disableClose = true;

		return this.dialog.open<T, D, R>(componentRef, { ...defaultConfig, ...сonfig });
	}
}
