import { NgModule } from '@angular/core';
import { RouterLink } from '@angular/router';

import { MapperModule } from '@dynamic-mapper/angular';
import { NgxsModule } from '@ngxs/store';

import { PaymentAccountComponent } from './components/payment-account/payment-account.component';
import { PaymentAccountCrudComponent } from './components/payment-account-crud/payment-account-crud.component';
import { PaymentsDashboardComponent } from './components/payments-dashboard/payments-dashboard.component';
import { PaymentsHistoryComponent } from './components/payments-history/payments-history.component';
import { AccountingOperationsService } from './services/accounting-operations.service';
import { AccountsService } from './services/accounts.service';
import { CategoriesDialogService } from './services/categories-dialog.service';
import { ContractorsDialogService } from './services/contractors-dialog.service';
import { CrossAccountsTransferService } from './services/cross-accounts-transfer.dialog.service';
import { HandbooksService } from './services/handbooks.service';
import { PaymentAccountDialogService } from './services/payment-account-dialog.service';
import { PaymentsHistoryService } from './services/payments-history.service';
import { AppCoreModule } from '../../app/modules/core/core.module';
import { AngularMaterialSharedModule } from '../../app/modules/shared/angular-material.shared.module';
import { CustomUIComponentsSharedModule } from '../../app/modules/shared/custom-ui-components.shared.module';
import { DialogsSharedModule } from '../../app/modules/shared/dialogs.shared.module';
import { AppSharedModule } from '../../app/modules/shared/shared.module';
import { AccountingOperationsTableState } from '../../app/modules/shared/store/states/accounting/accounting-operations-table.state';
import { PaymentAccountState } from '../../app/modules/shared/store/states/accounting/payment-account.state';
import { AccountingOperationsState } from '../../app/modules/shared/store/states/accounting/payment-operations.state';
import { CategoriesState } from '../../app/modules/shared/store/states/handbooks/categories.state';
import { ContractorsState } from '../../app/modules/shared/store/states/handbooks/contractors.state';
import { HandbooksState as HandbooksState } from '../../app/modules/shared/store/states/handbooks/handbooks.state';
import { DefaultCategoriesProvider } from '../../data/providers/accounting/categories.provider';
import { DefaultContractorsProvider } from '../../data/providers/accounting/contractors.provider';
import { CrossAccountsTransferProvider } from '../../data/providers/accounting/cross-accounts-transfer.provider';
import { DataCategoryProfile } from '../../data/providers/accounting/mappers/category.mapping.profile';
import { DataContractorProfile } from '../../data/providers/accounting/mappers/contractor.mapping.profile';
import { PaymentAccountsMappingProfile } from '../../data/providers/accounting/mappers/payment-accounts.mapping.profile';
import { PaymentHistoryMappingProfile } from '../../data/providers/accounting/mappers/payment-history.mapping.profile';
import { PaymentOperationsMappingProfile } from '../../data/providers/accounting/mappers/payment-operations.mapping.profile';
import { PaymentRepresentationsMappingProfile } from '../../data/providers/accounting/mappers/payment-representations.mapping.profile';
import { DefaultPaymentAccountsProvider } from '../../data/providers/accounting/payment-accounts.provider';
import { PaymentOperationsProvider } from '../../data/providers/accounting/payment-operations.provider';
import { PaymentsHistoryProvider } from '../../data/providers/accounting/payments-history.provider';
import { CurrencyExchangeService } from '../../data/providers/rates/currency-exchange.service';
import { ExchangeRatesMappingProfile } from '../../data/providers/rates/mappers/exchange-rates-mapping.profile';
import { AccountingOperationsCrudComponent, AccountingRoutingModule } from '../accounting';
import { AccountingLayoutComponent } from '../../app/modules/app-bootstrap/components/accounting-layout/accounting-layout.component';

@NgModule({
	declarations: [
		AccountingLayoutComponent,
		AccountingOperationsCrudComponent,
		PaymentAccountComponent,
		PaymentsHistoryComponent,
		PaymentsDashboardComponent,
		PaymentAccountCrudComponent,
	],
	imports: [
		AngularMaterialSharedModule,
		RouterLink,
		AppSharedModule,

		AngularMaterialSharedModule,
		CustomUIComponentsSharedModule,
		AppCoreModule,
		AccountingRoutingModule,
		DialogsSharedModule,
		NgxsModule.forFeature([
			AccountingOperationsState,
			AccountingOperationsTableState,
			HandbooksState,
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
			ExchangeRatesMappingProfile,
		]),
	],
	providers: [
		PaymentsHistoryService,
		AccountsService,
		DefaultPaymentAccountsProvider,
		PaymentOperationsProvider,
		PaymentsHistoryProvider,
		DefaultContractorsProvider,
		CrossAccountsTransferProvider,
		DefaultCategoriesProvider,
		CategoriesDialogService,
		ContractorsDialogService,
		PaymentAccountDialogService,
		CrossAccountsTransferService,
		AccountingOperationsService,
		HandbooksService,
		CurrencyExchangeService,
	],
	bootstrap: [AccountingLayoutComponent],
})
export class AccountingModule {}
