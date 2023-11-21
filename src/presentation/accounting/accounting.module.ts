import { NgModule } from '@angular/core';

import { NgxsModule } from '@ngxs/store';
import { MapperModule } from '@dynamic-mapper/angular';

import {
	AccountingOperationsCrudComponent,
	AccountingOperatiosGridComponent,
	AccountingRoutingModule,
} from '../accounting';
import { AccountingOperationsTableState } from '../../app/modules/shared/store/states/accounting/accounting-operations-table.state';
import { CategoriesDialogService } from 'presentation/accounting/services/categories-dialog.service';
import { CounterpartiesState } from '../../app/modules/shared/store/states/handbooks/counterparties.state';
import { CategoriesState } from '../../app/modules/shared/store/states/handbooks/categories.state';
import { HandbbooksState } from '../../app/modules/shared/store/states/handbooks/handbooks.state';
import { AppSharedModule } from '../../app/modules/shared/shared.module';
import { AccountingOperationsState } from '../../app/modules/shared/store/states/accounting/payment-operations.state';
import { CounterpartiesDialogService } from './services/counterparties-dialog.service';
import { PaymentAccountComponent } from './components/payment-account/payment-account.component';
import { PaymentAccountState } from '../../app/modules/shared/store/states/accounting/payment-account.state';
import { PaymentAccountCrudComponent } from './components/payment-account-crud/payment-account-crud.component';
import { PaymentAccountDialogService } from './services/payment-account-dialog.service';
import { DefaultPaymentAccountsProvider } from '../../data/providers/accounting/payment-accounts.provider';
import { PaymentAccountsMappingProfile } from '../../data/providers/accounting/mappers/payment-accounts.mapping.profile';
import { DefaultContractorsProvider } from '../../data/providers/accounting/contractors.provider';
import { DataContractorProfile } from '../../data/providers/accounting/mappers/contractor.mapping.profile';
import { AccountingOperationsService } from './services/accounting-operations.service';
import { DialogsSharedModule } from '../../app/modules/shared/dialogs.shared.module';
import { AppCoreModule } from '../../app/modules/core/core.module';
import { CustomUIComponentsSharedModule } from '../../app/modules/shared/custom-ui-components.shared.module';
import { AngularMaterailSharedModule } from '../../app/modules/shared/angular-material.shared.module';
import { DataCategoryProfile } from '../../data/providers/accounting/mappers/category.mapping.profile';
import { DefaultCategoriesProvider } from '../../data/providers/accounting/categories.provider';
import { PaymentOperationsMappingProfile } from '../../data/providers/accounting/mappers/payment-operations.mapping.profile';
import { PaymentOperationsProvider } from '../../data/providers/accounting/payment-operations.provider';

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
