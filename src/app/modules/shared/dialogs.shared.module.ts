import { NgModule } from '@angular/core';

import { AngularMaterailSharedModule } from './angular-material.shared.module';
import { CategoriesDialogComponent } from './components/dialog/categories/categories-dialog.component';
import { ContractorsDialogComponent } from './components/dialog/contractors/contractors-dialog.component';
import { DateRangeDialogComponent } from './components/dialog/dates-rage/dates-range-dialog.component';
import { PaymentAccountDialogComponent } from './components/dialog/payment-account/payment-account-dialog.component';
import { CustomUIComponentsSharedModule } from './custom-ui-components.shared.module';
import { DialogProvider } from './providers/dialog-provider';
import { AppSharedModule } from './shared.module';
import { AppCoreModule } from '../core';

const dialogComponents = [
	DateRangeDialogComponent,
	CategoriesDialogComponent,
	PaymentAccountDialogComponent,
	ContractorsDialogComponent,
];

@NgModule({
	declarations: [dialogComponents],
	exports: [dialogComponents],
	imports: [AppCoreModule, AngularMaterailSharedModule, CustomUIComponentsSharedModule, AppSharedModule],
	schemas: [],
	providers: [DialogProvider],
	bootstrap: [],
})
export class DialogsSharedModule {}
