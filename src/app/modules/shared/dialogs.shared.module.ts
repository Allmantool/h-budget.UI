import { NgModule } from '@angular/core';

import { AngularMaterialSharedModule } from './angular-material.shared.module';
import { CategoriesDialogComponent } from './components/dialog/categories/categories-dialog.component';
import { ContractorsDialogComponent } from './components/dialog/contractors/contractors-dialog.component';
import { CrossAccountsTransferDialogComponent } from './components/dialog/cross-accounts-transfer/cross-accounts-transfer-dialog.component';
import { DateRangeDialogComponent } from './components/dialog/dates-rage/dates-range-dialog.component';
import { PaymentAccountDialogComponent } from './components/dialog/payment-account/payment-account-dialog.component';
import { CustomUIComponentsSharedModule } from './custom-ui-components.shared.module';
import { DialogProvider } from './providers/dialog-provider';
import { AppSharedModule } from './shared.module';
import { AppCoreModule } from '../core';

const standaloneDialogComponents = [
	DateRangeDialogComponent,
	CategoriesDialogComponent,
	ContractorsDialogComponent,
	CrossAccountsTransferDialogComponent,
];

const dialogComponents = [
	DateRangeDialogComponent,
	CategoriesDialogComponent,
	PaymentAccountDialogComponent,
	ContractorsDialogComponent,
	CrossAccountsTransferDialogComponent,
];

const moduleDialogComponents = [PaymentAccountDialogComponent];

@NgModule({
	declarations: [moduleDialogComponents],
	exports: [dialogComponents],
	imports: [
		AppCoreModule,
		AngularMaterialSharedModule,
		CustomUIComponentsSharedModule,
		AppSharedModule,
		standaloneDialogComponents,
	],
	schemas: [],
	providers: [DialogProvider],
	bootstrap: [],
})
export class DialogsSharedModule {}
