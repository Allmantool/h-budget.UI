import { NgModule } from '@angular/core';

import { MapperModule } from '@dynamic-mapper/angular';
import { NgxsModule } from '@ngxs/store';

import { PaymentAccountComponent } from './components/payment-account/payment-account.component';
import { PaymentAccountCrudComponent } from './components/payment-account-crud/payment-account-crud.component';
import { AccountingOperationsService } from './services/accounting-operations.service';
import { CategoriesDialogService } from './services/categories-dialog.service';
import { CounterpartiesDialogService } from './services/counterparties-dialog.service';
import { PaymentAccountDialogService } from './services/payment-account-dialog.service';
import { AppCoreModule } from '../../app/modules/core/core.module';
import { AngularMaterailSharedModule } from '../../app/modules/shared/angular-material.shared.module';
import { CustomUIComponentsSharedModule } from '../../app/modules/shared/custom-ui-components.shared.module';
import { DialogsSharedModule } from '../../app/modules/shared/dialogs.shared.module';
import { AppSharedModule } from '../../app/modules/shared/shared.module';
import { AccountingOperationsTableState } from '../../app/modules/shared/store/states/accounting/accounting-operations-table.state';
import { PaymentAccountState } from '../../app/modules/shared/store/states/accounting/payment-account.state';
import { AccountingOperationsState } from '../../app/modules/shared/store/states/accounting/payment-operations.state';
import { CategoriesState } from '../../app/modules/shared/store/states/handbooks/categories.state';
import { CounterpartiesState } from '../../app/modules/shared/store/states/handbooks/counterparties.state';
import { HandbbooksState } from '../../app/modules/shared/store/states/handbooks/handbooks.state';
import { DefaultCategoriesProvider } from '../../data/providers/accounting/categories.provider';
import { DefaultContractorsProvider } from '../../data/providers/accounting/contractors.provider';
import { DataCategoryProfile } from '../../data/providers/accounting/mappers/category.mapping.profile';
import { DataContractorProfile } from '../../data/providers/accounting/mappers/contractor.mapping.profile';
import { PaymentAccountsMappingProfile } from '../../data/providers/accounting/mappers/payment-accounts.mapping.profile';
import { PaymentOperationsMappingProfile } from '../../data/providers/accounting/mappers/payment-operations.mapping.profile';
import { DefaultPaymentAccountsProvider } from '../../data/providers/accounting/payment-accounts.provider';
import { PaymentOperationsProvider } from '../../data/providers/accounting/payment-operations.provider';
import {
	AccountingOperationsCrudComponent,
	AccountingOperatiosGridComponent,
	AccountingRoutingModule,
} from '../accounting';

@NgModule({
	declarations: [
		AccountingOperatiosGridComponent,
		AccountingOperationsCrudComponent,
		PaymentAccountComponent,
		PaymentAccountCrudComponent,
	],
	imports: [
		AppSharedModule,
		AngularMaterailSharedModule,
		CustomUIComponentsSharedModule,
		AppCoreModule,
		AccountingRoutingModule,
		DialogsSharedModule,
		NgxsModule.forFeature([
			AccountingOperationsState,
			AccountingOperationsTableState,
			HandbbooksState,
			CounterpartiesState,
			CategoriesState,
			PaymentAccountState,
		]),
		MapperModule.withProfiles([
			PaymentAccountsMappingProfile,
			PaymentOperationsMappingProfile,
			DataContractorProfile,
			DataCategoryProfile,
		]),
	],
	providers: [
		DefaultPaymentAccountsProvider,
		PaymentOperationsProvider,
		DefaultContractorsProvider,
		DefaultCategoriesProvider,
		CategoriesDialogService,
		CounterpartiesDialogService,
		PaymentAccountDialogService,
		AccountingOperationsService,
	],
	bootstrap: [],
})
export class AccountingModule {}
