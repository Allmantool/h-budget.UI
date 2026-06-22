import { OverlayContainer } from '@angular/cdk/overlay';
import { Component, ErrorHandler, inject } from '@angular/core';
import { fakeAsync, flush, TestBed } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

import { createStandaloneRootTestProviders } from './support/standalone-root-provider-test-config';
import { DatepickerComponent } from '../../app/modules/shared/components/datepicker/app-datepicker.component';

@Component({
	standalone: true,
	imports: [MatButtonModule, MatDialogModule],
	template: `
		<h2 mat-dialog-title>Root parity dialog</h2>
		<mat-dialog-content>Dialog provider smoke content</mat-dialog-content>
		<mat-dialog-actions>
			<button
				mat-button
				type="button"
				(click)="close()"
			>
				Close
			</button>
		</mat-dialog-actions>
	`,
})
class RootParityDialogComponent {
	private readonly dialogRef = inject<MatDialogRef<RootParityDialogComponent, string>>(MatDialogRef);

	public close(): void {
		this.dialogRef.close('confirmed');
	}
}

@Component({
	standalone: true,
	imports: [DatepickerComponent],
	template: '<app-datepicker placeholder="Root date"></app-datepicker>',
})
class DatepickerHostComponent {}

describe('root provider Material and animation parity', () => {
	let dialog: MatDialog;
	let overlayContainer: OverlayContainer;
	let focusOrigin: HTMLButtonElement;

	beforeEach(() => {
		TestBed.resetTestingModule();
		TestBed.configureTestingModule({
			imports: [DatepickerHostComponent],
			providers: [
				...createStandaloneRootTestProviders({
					production: false,
					includeAnimations: true,
					loadSettings: () => Promise.resolve(undefined),
					createErrorHandler: () => new ErrorHandler(),
				}),
			],
		});

		dialog = TestBed.inject(MatDialog);
		overlayContainer = TestBed.inject(OverlayContainer);
		focusOrigin = document.createElement('button');
		document.body.appendChild(focusOrigin);
		focusOrigin.focus();
	});

	afterEach(() => {
		dialog.closeAll();
		overlayContainer.ngOnDestroy();
		focusOrigin.remove();
	});

	it('opens, renders, closes, and restores focus for a Material dialog', fakeAsync(() => {
		let dialogResult: string | undefined;
		const dialogRef = dialog.open<RootParityDialogComponent, unknown, string>(RootParityDialogComponent, {
			restoreFocus: true,
		});

		dialogRef.afterClosed().subscribe(result => {
			dialogResult = result;
		});
		flush();

		expect(overlayContainer.getContainerElement().textContent).toContain('Root parity dialog');
		expect(overlayContainer.getContainerElement().textContent).toContain('Dialog provider smoke content');

		dialogRef.componentInstance.close();
		flush();

		expect(dialogResult).toBe('confirmed');
		expect(dialog.openDialogs.length).toBe(0);
		expect(document.activeElement).toBe(focusOrigin);
	}));

	it('initializes the existing datepicker and opens its overlay with provider-based animations', fakeAsync(() => {
		const fixture = TestBed.createComponent(DatepickerHostComponent);

		fixture.detectChanges();
		flush();

		const nativeElement = fixture.nativeElement as HTMLElement;
		const datepickerToggle = nativeElement.querySelector<HTMLButtonElement>('mat-datepicker-toggle button');

		expect(datepickerToggle).not.toBeNull();

		datepickerToggle?.click();
		fixture.detectChanges();
		flush();

		expect(overlayContainer.getContainerElement().querySelector('mat-datepicker-content')).not.toBeNull();
	}));
});
