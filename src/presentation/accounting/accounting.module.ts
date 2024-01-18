import { NgModule } from '@angular/core';

import { MapperModule } from '@dynamic-mapper/angular';
import { NgxsModule } from '@ngxs/store';

import { PaymentAccountComponent } from './components/payment-account/payment-account.component';
import { PaymentAccountCrudComponent } from './components/payment-account-crud/payment-account-crud.component';
import { PaymentsHistoryComponent } from './components/payments-history/payments-history.component';
import { AccountingOperationsService } from './services/accounting-operations.service';
import { CategoriesDialogService } from './services/categories-dialog.service';
import { ContractorsDialogService } from './services/contractors-dialog.service';
import { PaymentAccountDialogService } from './services/payment-account-dialog.service';
import { PaymentsHistoryService } from './services/payments-history.service';
import { AppCoreModule } from '../../app/modules/core/core.module';
import { AngularMaterailSharedModule } from '../../app/modules/shared/angular-material.shared.module';
import { CustomUIComponentsSharedModule } from '../../app/modules/shared/custom-ui-components.shared.module';
import { DialogsSharedModule } from '../../app/modules/shared/dialogs.shared.module';
import { AppSharedModule } from '../../app/modules/shared/shared.module';
import { AccountingOperationsTableState } from '../../app/modules/shared/store/states/accounting/accounting-operations-table.state';
import { PaymentAccountState } from '../../app/modules/shared/store/states/accounting/payment-account.state';
import { AccountingOperationsState } from '../../app/modules/shared/store/states/accounting/payment-operations.state';
import { CategoriesState } from '../../app/modules/shared/store/states/handbooks/categories.state';
import { ContractorsState } from '../../app/modules/shared/store/states/handbooks/contractors.state';
import { HandbbooksState } from '../../app/modules/shared/store/states/handbooks/handbooks.state';
import { DefaultCategoriesProvider } from '../../data/providers/accounting/categories.provider';
import { DefaultContractorsProvider } from '../../data/providers/accounting/contractors.provider';
import { DataCategoryProfile } from '../../data/providers/accounting/mappers/category.mapping.profile';
import { DataContractorProfile } from '../../data/providers/accounting/mappers/contractor.mapping.profile';
import { PaymentAccountsMappingProfile } from '../../data/providers/accounting/mappers/payment-accounts.mapping.profile';
import { PaymentHistoryMappingProfile } from '../../data/providers/accounting/mappers/payment-history.mapping.profile';
import { PaymentOperationsMappingProfile } from '../../data/providers/accounting/mappers/payment-operations.mapping.profile';
import { PaymentRepresentationsMappingProfile } from '../../data/providers/accounting/mappers/payment-representations.mapping.profile';
import { DefaultPaymentAccountsProvider } from '../../data/providers/accounting/payment-accounts.provider';
import { PaymentOperationsProvider } from '../../data/providers/accounting/payment-operations.provider';
import { PaymensHistoryProvider } from '../../data/providers/accounting/payments-history.provider';
import { AccountingOperationsCrudComponent, AccountingRoutingModule } from '../accounting';

@NgModule({
	declarations: [
		AccountingOperationsCrudComponent,
		PaymentAccountComponent,
		PaymentsHistoryComponent,
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
			ContractorsState,
			CategoriesState,
			PaymentAccountState,
		]),
		MapperModule.withProfiles([
			PaymentAccountsMappingProfile,
			PaymentOperationsMappingProfile,
			PaymentRepresentationsMappingProfile,
			PaymentHistoryMappingProfile,
			DataContractorProfile,
			DataCategoryProfile,
		]),
	],
	providers: [
		PaymentsHistoryService,
		DefaultPaymentAccountsProvider,
		PaymentOperationsProvider,
		PaymensHistoryProvider,
		DefaultContractorsProvider,
		DefaultCategoriesProvider,
		CategoriesDialogService,
		ContractorsDialogService,
		PaymentAccountDialogService,
		AccountingOperationsService,
	],
	bootstrap: [],
})
export class AccountingModule {}
