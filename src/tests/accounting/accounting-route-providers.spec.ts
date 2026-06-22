import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Component, createEnvironmentInjector, EnvironmentInjector, Provider, Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatDialogConfig } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Router, RouterOutlet, Routes } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';

import { Mapper } from '@dynamic-mapper/angular';
import { NgxsModule, Store } from '@ngxs/store';
import { of, Subject } from 'rxjs';
import { Guid } from 'typescript-guid';

import { AccountingLayoutComponent } from '../../app/modules/app-bootstrap/components/accounting-layout/accounting-layout.component';
import { CategoriesDialogComponent } from '../../app/modules/shared/components/dialog/categories/categories-dialog.component';
import { ContractorsDialogComponent } from '../../app/modules/shared/components/dialog/contractors/contractors-dialog.component';
import { CrossAccountsTransferDialogComponent } from '../../app/modules/shared/components/dialog/cross-accounts-transfer/cross-accounts-transfer-dialog.component';
import { PaymentAccountDialogComponent } from '../../app/modules/shared/components/dialog/payment-account/payment-account-dialog.component';
import { DialogContainer } from '../../app/modules/shared/models/dialog-container';
import { DialogProvider } from '../../app/modules/shared/providers/dialog-provider';
import { ngxsConfig } from '../../app/modules/shared/store/ngxs.config';
import { AccountingOperationsTableState } from '../../app/modules/shared/store/states/accounting/accounting-operations-table.state';
import { SetActivePaymentAccount } from '../../app/modules/shared/store/states/accounting/actions/payment-account.actions';
import { SetInitialPaymentOperations } from '../../app/modules/shared/store/states/accounting/actions/payment-operation.actions';
import { IAccountingOperationsStateModel } from '../../app/modules/shared/store/states/accounting/models/accounting-state.model';
import { IAccountingTableStateModel } from '../../app/modules/shared/store/states/accounting/models/accounting-table-state.model';
import { IPaymentAccountStateModel } from '../../app/modules/shared/store/states/accounting/models/payment-account-state.model';
import { PaymentAccountState } from '../../app/modules/shared/store/states/accounting/payment-account.state';
import { AccountingOperationsState } from '../../app/modules/shared/store/states/accounting/payment-operations.state';
import { CoreAppState } from '../../app/modules/shared/store/states/core/core-app.state';
import { CategoriesState } from '../../app/modules/shared/store/states/handbooks/categories.state';
import { ContractorsState } from '../../app/modules/shared/store/states/handbooks/contractors.state';
import { HandbooksState } from '../../app/modules/shared/store/states/handbooks/handbooks.state';
import { Result } from '../../core/result';
import { DefaultCategoriesProvider } from '../../data/providers/accounting/categories.provider';
import { DefaultContractorsProvider } from '../../data/providers/accounting/contractors.provider';
import { CrossAccountsTransferProvider } from '../../data/providers/accounting/cross-accounts-transfer.provider';
import { IPaymentAccountEntity } from '../../data/providers/accounting/entities/payment-account.entity';
import { PaymentAccountsMappingProfile } from '../../data/providers/accounting/mappers/payment-accounts.mapping.profile';
import { PaymentOperationsMappingProfile } from '../../data/providers/accounting/mappers/payment-operations.mapping.profile';
import { DefaultPaymentAccountsProvider } from '../../data/providers/accounting/payment-accounts.provider';
import { PaymentOperationsProvider } from '../../data/providers/accounting/payment-operations.provider';
import { PaymentsHistoryProvider } from '../../data/providers/accounting/payments-history.provider';
import { CurrencyExchangeService } from '../../data/providers/rates/currency-exchange.service';
import { AccountTypes } from '../../domain/models/accounting/account-types';
import { ICategoryModel } from '../../domain/models/accounting/category.model';
import { IContractorModel } from '../../domain/models/accounting/contractor.model.';
import { IPaymentAccountModel } from '../../domain/models/accounting/payment-account.model';
import { IPaymentOperationModel } from '../../domain/models/accounting/payment-operation.model';
import { IPaymentAccountCreateOrUpdateResponse } from '../../domain/models/accounting/responses/payment-account-create-or-update.response';
import { OperationTypes } from '../../domain/types/operation.types';
import { AccountNotification } from '../../infrastructure/account-notification';
import { SseService } from '../../infrastructure/sse-service';
import { accountingRoutes } from '../../presentation/accounting/accounting.routes';
import { AccountingOperationsCrudComponent } from '../../presentation/accounting/components/accounting-operations-crud/accounting-operations-crud.component';
import { PaymentAccountComponent } from '../../presentation/accounting/components/payment-account/payment-account.component';
import { PaymentAccountCrudComponent } from '../../presentation/accounting/components/payment-account-crud/payment-account-crud.component';
import { PaymentsDashboardComponent } from '../../presentation/accounting/components/payments-dashboard/payments-dashboard.component';
import { IPaymentRepresentationModel } from '../../presentation/accounting/models/operation-record';
import { AccountingOperationsService } from '../../presentation/accounting/services/accounting-operations.service';
import { AccountsService } from '../../presentation/accounting/services/accounts.service';
import { CategoriesDialogService } from '../../presentation/accounting/services/categories-dialog.service';
import { ContractorsDialogService } from '../../presentation/accounting/services/contractors-dialog.service';
import { CrossAccountsTransferService } from '../../presentation/accounting/services/cross-accounts-transfer.dialog.service';
import { HandbooksService } from '../../presentation/accounting/services/handbooks.service';
import { PaymentAccountDialogService } from '../../presentation/accounting/services/payment-account-dialog.service';
import { PaymentsHistoryService } from '../../presentation/accounting/services/payments-history.service';

interface AccountingFeatureState {
	accountingOperations: IAccountingOperationsStateModel & {
		accountingOperationsTableState: IAccountingTableStateModel;
	};
	paymentAccounts: IPaymentAccountStateModel;
}

@Component({
	standalone: true,
	template: '',
})
class RoutePlaceholderComponent {}

@Component({
	standalone: true,
	imports: [RouterOutlet],
	template: '<router-outlet></router-outlet>',
})
class DashboardRouteHostComponent {}

describe('accounting route providers', () => {
	let parentInjector: EnvironmentInjector;
	let featureInjectors: EnvironmentInjector[];

	beforeEach(() => {
		TestBed.resetTestingModule();

		featureInjectors = [];

		TestBed.configureTestingModule({
			imports: [HttpClientTestingModule, NgxsModule.forRoot([], ngxsConfig)],
		});

		parentInjector = TestBed.inject(EnvironmentInjector);
	});

	afterEach(() => {
		featureInjectors.forEach(injector => injector.destroy());
	});

	it('keeps all Accounting routes under one provider-owning parent', () => {
		const providerParent = getAccountingProviderParentRoute();
		const childRoutes = providerParent.children ?? [];

		expect(accountingRoutes.length).toBe(1);
		expect(providerParent.path).toBe('');
		expect(providerParent.component).toBeUndefined();
		expect(providerParent.providers).toBeDefined();
		expect(childRoutes).toEqual([
			jasmine.objectContaining({ path: 'operations', component: PaymentsDashboardComponent }),
			jasmine.objectContaining({ path: '', component: PaymentAccountComponent }),
			jasmine.objectContaining({
				path: 'operations',
				component: AccountingOperationsCrudComponent,
				outlet: 'right_sidebar',
			}),
			jasmine.objectContaining({ path: '', component: PaymentAccountCrudComponent, outlet: 'right_sidebar' }),
		]);
		expect(childRoutes.every(route => route.providers === undefined)).toBeTrue();
	});

	it('resolves all former module-bound Accounting providers from the feature route injector only', () => {
		const featureInjector = createFeatureInjector();

		for (const provider of accountingFeatureProviders) {
			expect(parentInjector.get(provider, null)).withContext(provider.name).toBeNull();
			expect(featureInjector.get(provider)).withContext(provider.name).toEqual(jasmine.any(provider));
			expect(featureInjector.get(provider))
				.withContext(`${provider.name} identity`)
				.toBe(featureInjector.get(provider));
		}
	});

	it('registers NGXS feature states and supports route re-entry', () => {
		const firstFeatureInjector = createFeatureInjector();
		const firstStore = firstFeatureInjector.get(Store);

		expect(getAccountingState(firstStore).operationRecords).toEqual([]);
		expect(getAccountingState(firstStore).activeCurrency).toBe('BYN');
		expect(getPaymentAccountState(firstStore).activeAccountGuid).toBe('');
		expect(getPaymentAccountState(firstStore).accounts).toEqual([]);
		expect(getAccountingState(firstStore).accountingOperationsTableState.tableOptions).toEqual(
			{} as IAccountingTableStateModel['tableOptions']
		);

		firstStore.dispatch(new SetActivePaymentAccount(sampleAccount.key!.toString()));
		firstStore.dispatch(new SetInitialPaymentOperations([sampleOperation]));

		expect(getPaymentAccountState(firstStore).activeAccountGuid).toBe(sampleAccount.key!.toString());
		expect(getAccountingState(firstStore).operationRecords).toEqual([sampleOperation]);

		firstFeatureInjector.destroy();
		featureInjectors = featureInjectors.filter(injector => injector !== firstFeatureInjector);

		expect(() => createFeatureInjector()).not.toThrow();
	});

	it('keeps Accounting Dynamic Mapper profiles available from the route injector', () => {
		const mapper = createFeatureInjector().get(Mapper);
		const accountResult: IPaymentAccountModel[] = mapper.map(
			PaymentAccountsMappingProfile.PaymentAccountEntityToDomain,
			sampleAccountEntities
		);
		const operationRequest = mapper.map(
			PaymentOperationsMappingProfile.DomainToPaymentOperationSaveRequest,
			sampleOperation
		);

		expect(accountResult.length).toBe(1);
		expect(accountResult[0].key!.equals(sampleAccount.key!)).toBeTrue();
		expect(accountResult[0].emitter).toBe(sampleAccount.emitter);
		expect(operationRequest.amount).toBe(sampleOperation.amount);
		expect(operationRequest.categoryId).toBe(sampleOperation.categoryId.toString());
	});

	it('preserves DialogProvider and Accounting dialog services through the route injector', () => {
		const dialogProviderSpy = jasmine.createSpyObj<DialogProvider>('dialogProvider', ['openDialog']);
		const featureInjector = createFeatureInjector([{ provide: DialogProvider, useValue: dialogProviderSpy }]);

		expect(createFeatureInjector().get(DialogProvider)).toEqual(jasmine.any(DialogProvider));
		expect(featureInjector.get(CategoriesDialogService)).toEqual(jasmine.any(CategoriesDialogService));
		expect(featureInjector.get(ContractorsDialogService)).toEqual(jasmine.any(ContractorsDialogService));
		expect(featureInjector.get(PaymentAccountDialogService)).toEqual(jasmine.any(PaymentAccountDialogService));
		expect(featureInjector.get(CrossAccountsTransferService)).toEqual(jasmine.any(CrossAccountsTransferService));

		featureInjector.get(CategoriesDialogService).openCategories();
		expect(dialogProviderSpy.openDialog.calls.mostRecent().args[0]).toBe(CategoriesDialogComponent);

		featureInjector.get(ContractorsDialogService).openContractors();
		expect(dialogProviderSpy.openDialog.calls.mostRecent().args[0]).toBe(ContractorsDialogComponent);

		featureInjector.get(CrossAccountsTransferService).openForTransfer();
		expect(dialogProviderSpy.openDialog.calls.mostRecent().args[0]).toBe(CrossAccountsTransferDialogComponent);

		featureInjector.get(PaymentAccountDialogService).openForSave();

		const [componentRef, dialogConfig] = dialogProviderSpy.openDialog.calls.mostRecent().args;
		const typedDialogConfig = dialogConfig as MatDialogConfig<
			DialogContainer<Result<IPaymentAccountModel>, Result<IPaymentAccountModel>>
		>;
		let cancellationResult: Result<IPaymentAccountModel> | undefined;

		typedDialogConfig.data!.onSubmit(new Result<IPaymentAccountModel>({ isSucceeded: false })).subscribe(result => {
			cancellationResult = result;
		});

		expect(componentRef).toBe(PaymentAccountDialogComponent);
		expect(typedDialogConfig.disableClose).toBeTrue();
		expect(cancellationResult?.isSucceeded).toBeFalse();
	});

	function createFeatureInjector(extraProviders: Provider[] = []): EnvironmentInjector {
		const featureInjector = createEnvironmentInjector(
			[...getAccountingRouteProviders(), ...extraProviders],
			parentInjector,
			'AccountingRouteProvidersSpec'
		);

		featureInjectors.push(featureInjector);

		return featureInjector;
	}
});

describe('accounting lazy route and named-outlet activation', () => {
	let paymentAccountsProviderSpy: jasmine.SpyObj<DefaultPaymentAccountsProvider>;
	let paymentOperationsProviderSpy: jasmine.SpyObj<PaymentOperationsProvider>;
	let paymentsHistoryProviderSpy: jasmine.SpyObj<PaymentsHistoryProvider>;
	let categoriesProviderSpy: jasmine.SpyObj<DefaultCategoriesProvider>;
	let contractorsProviderSpy: jasmine.SpyObj<DefaultContractorsProvider>;
	let crossAccountsTransferProviderSpy: jasmine.SpyObj<CrossAccountsTransferProvider>;
	let dialogProviderSpy: jasmine.SpyObj<DialogProvider>;
	let sseServiceSpy: jasmine.SpyObj<SseService>;
	let notificationsSubject: Subject<AccountNotification>;

	beforeEach(() => {
		TestBed.resetTestingModule();

		paymentAccountsProviderSpy = createPaymentAccountsProviderSpy();
		paymentOperationsProviderSpy = jasmine.createSpyObj<PaymentOperationsProvider>('paymentOperationsProvider', [
			'savePaymentOperation',
			'updatePaymentOperation',
			'removePaymentOperation',
		]);
		paymentsHistoryProviderSpy = jasmine.createSpyObj<PaymentsHistoryProvider>('paymentsHistoryProvider', [
			'getOperationsHistoryForPaymentAccount',
			'GetHistoryOperationById',
		]);
		categoriesProviderSpy = createCategoriesProviderSpy();
		contractorsProviderSpy = createContractorsProviderSpy();
		crossAccountsTransferProviderSpy = jasmine.createSpyObj<CrossAccountsTransferProvider>(
			'crossAccountsTransferProvider',
			['applyTransfer', 'deleteById']
		);
		dialogProviderSpy = jasmine.createSpyObj<DialogProvider>('dialogProvider', ['openDialog']);
		notificationsSubject = new Subject<AccountNotification>();
		sseServiceSpy = jasmine.createSpyObj<SseService>('sseService', ['connect', 'disconnect'], {
			notifications$: notificationsSubject.asObservable(),
		});

		paymentOperationsProviderSpy.savePaymentOperation.and.returnValue(
			of(
				new Result<IPaymentAccountCreateOrUpdateResponse>({
					isSucceeded: true,
					payload: sampleOperationResponse,
				})
			)
		);
		paymentOperationsProviderSpy.updatePaymentOperation.and.returnValue(
			of(
				new Result<IPaymentAccountCreateOrUpdateResponse>({
					isSucceeded: true,
					payload: sampleOperationResponse,
				})
			)
		);
		paymentOperationsProviderSpy.removePaymentOperation.and.returnValue(
			of(
				new Result<IPaymentAccountCreateOrUpdateResponse>({
					isSucceeded: true,
					payload: sampleOperationResponse,
				})
			)
		);
		paymentsHistoryProviderSpy.getOperationsHistoryForPaymentAccount.and.returnValue(
			of([{ balance: sampleAccount.balance, record: sampleOperation }])
		);
		paymentsHistoryProviderSpy.GetHistoryOperationById.and.returnValue(
			of({ balance: sampleAccount.balance, record: sampleOperation })
		);
		crossAccountsTransferProviderSpy.applyTransfer.and.returnValue(
			of(new Result<Guid>({ isSucceeded: true, payload: sampleOperation.key }))
		);
		crossAccountsTransferProviderSpy.deleteById.and.returnValue(
			of(new Result<Guid>({ isSucceeded: true, payload: sampleOperation.key }))
		);

		TestBed.configureTestingModule({
			imports: [
				NoopAnimationsModule,
				NgxsModule.forRoot(
					[
						CoreAppState,
						AccountingOperationsState,
						AccountingOperationsTableState,
						HandbooksState,
						ContractorsState,
						CategoriesState,
						PaymentAccountState,
					],
					ngxsConfig
				),
				RouterTestingModule.withRoutes(getRouterTestRoutes()),
			],
			providers: [{ provide: SseService, useValue: sseServiceSpy }],
		});
	});

	afterEach(() => {
		notificationsSubject.complete();
	});

	it('keeps the account and operations named-outlet routes under the same tested route tree', () => {
		const router = TestBed.inject(Router);

		router.resetConfig(getRouterTestRoutes());

		expect(router.config.map(route => route.path)).toContain('dashboard');
		expect(router.config[0].children?.[1]).toEqual(
			jasmine.objectContaining({
				path: 'accounting',
				component: AccountingLayoutComponent,
			})
		);
		expect(router.config[0].children?.[1].children?.[0]).toEqual(
			jasmine.objectContaining({
				path: '',
				children: [
					jasmine.objectContaining({ path: 'operations', component: PaymentsDashboardComponent }),
					jasmine.objectContaining({ path: '', component: PaymentAccountComponent }),
					jasmine.objectContaining({
						path: 'operations',
						outlet: 'right_sidebar',
						component: AccountingOperationsCrudComponent,
					}),
					jasmine.objectContaining({
						path: '',
						outlet: 'right_sidebar',
						component: PaymentAccountCrudComponent,
					}),
				],
			})
		);
	});

	function getTestAccountingRoutes(): Routes {
		const providerParent = getAccountingProviderParentRoute();

		return [
			{
				...providerParent,
				providers: [
					{ provide: DefaultPaymentAccountsProvider, useValue: paymentAccountsProviderSpy },
					{ provide: PaymentOperationsProvider, useValue: paymentOperationsProviderSpy },
					{ provide: PaymentsHistoryProvider, useValue: paymentsHistoryProviderSpy },
					{ provide: DefaultCategoriesProvider, useValue: categoriesProviderSpy },
					{ provide: DefaultContractorsProvider, useValue: contractorsProviderSpy },
					{ provide: CrossAccountsTransferProvider, useValue: crossAccountsTransferProviderSpy },
					{ provide: DialogProvider, useValue: dialogProviderSpy },
					{
						provide: HandbooksService,
						useValue: jasmine.createSpyObj<HandbooksService>('handbooksService', ['setupHandbooksStore']),
					},
					{
						provide: AccountsService,
						useValue: jasmine.createSpyObj<AccountsService>('accountsService', ['refreshAccounts']),
					},
					{ provide: PaymentsHistoryService, useValue: createPaymentsHistoryServiceSpy() },
					{
						provide: CrossAccountsTransferService,
						useValue: jasmine.createSpyObj<CrossAccountsTransferService>('crossAccountsTransferService', [
							'openForTransfer',
						]),
					},
					{
						provide: PaymentAccountDialogService,
						useValue: jasmine.createSpyObj<PaymentAccountDialogService>('paymentAccountDialogService', [
							'openForSave',
							'openForUpdate',
						]),
					},
					{
						provide: AccountingOperationsService,
						useValue: jasmine.createSpyObj<AccountingOperationsService>('accountingOperationsService', [
							'addNewAsync',
							'updateAsync',
							'deleteByIdAsync',
						]),
					},
					{
						provide: CategoriesDialogService,
						useValue: jasmine.createSpyObj<CategoriesDialogService>('categoriesDialogService', [
							'openCategories',
						]),
					},
					{
						provide: ContractorsDialogService,
						useValue: jasmine.createSpyObj<ContractorsDialogService>('contractorsDialogService', [
							'openContractors',
						]),
					},
				],
			},
		];
	}

	function getRouterTestRoutes(): Routes {
		return [
			{
				path: 'dashboard',
				component: DashboardRouteHostComponent,
				children: [
					{
						path: '',
						component: RoutePlaceholderComponent,
					},
					{
						path: 'accounting',
						component: AccountingLayoutComponent,
						children: getTestAccountingRoutes(),
					},
				],
			},
		];
	}
});

function getAccountingProviderParentRoute(): Routes[number] {
	const route = accountingRoutes[0];

	if (route?.path !== '' || !route.providers || !route.children) {
		throw new Error('Expected accountingRoutes to expose one provider-owning componentless parent route.');
	}

	return route;
}

function getAccountingRouteProviders(): NonNullable<Routes[number]['providers']> {
	const providers = getAccountingProviderParentRoute().providers;

	if (!providers) {
		throw new Error('Expected the Accounting provider parent route to expose providers.');
	}

	return providers;
}

function getAccountingState(store: Store): AccountingFeatureState['accountingOperations'] {
	const snapshot = store.snapshot() as AccountingFeatureState;

	return snapshot.accountingOperations;
}

function getPaymentAccountState(store: Store): IPaymentAccountStateModel {
	const snapshot = store.snapshot() as AccountingFeatureState;

	return snapshot.paymentAccounts;
}

function createPaymentAccountsProviderSpy(): jasmine.SpyObj<DefaultPaymentAccountsProvider> {
	const providerSpy = jasmine.createSpyObj<DefaultPaymentAccountsProvider>('paymentAccountsProvider', [
		'getPaymentAccounts',
		'getById',
		'removePaymentAccount',
		'savePaymentAccount',
		'updatePaymentAccount',
	]);

	providerSpy.getPaymentAccounts.and.returnValue(of([sampleAccount]));
	providerSpy.getById.and.returnValue(of(sampleAccount));
	providerSpy.removePaymentAccount.and.returnValue(of(new Result<boolean>({ isSucceeded: true, payload: true })));
	providerSpy.savePaymentAccount.and.returnValue(of(new Result({ isSucceeded: true, payload: sampleAccountId })));
	providerSpy.updatePaymentAccount.and.returnValue(of(new Result({ isSucceeded: true, payload: sampleAccountId })));

	return providerSpy;
}

function createCategoriesProviderSpy(): jasmine.SpyObj<DefaultCategoriesProvider> {
	const providerSpy = jasmine.createSpyObj<DefaultCategoriesProvider>('categoriesProvider', [
		'getCategoriries',
		'getCategoryById',
		'saveCategory',
	]);

	providerSpy.getCategoriries.and.returnValue(of([sampleCategory]));
	providerSpy.getCategoryById.and.returnValue(of(sampleCategory));
	providerSpy.saveCategory.and.returnValue(
		of(new Result({ isSucceeded: true, payload: sampleCategory.key.toString() }))
	);

	return providerSpy;
}

function createContractorsProviderSpy(): jasmine.SpyObj<DefaultContractorsProvider> {
	const providerSpy = jasmine.createSpyObj<DefaultContractorsProvider>('contractorsProvider', [
		'getContractors',
		'getContractorById',
		'saveContractor',
	]);

	providerSpy.getContractors.and.returnValue(of([sampleContractor]));
	providerSpy.getContractorById.and.returnValue(of(sampleContractor));
	providerSpy.saveContractor.and.returnValue(
		of(new Result({ isSucceeded: true, payload: sampleContractor.key.toString() }))
	);

	return providerSpy;
}

function createPaymentsHistoryServiceSpy(): jasmine.SpyObj<PaymentsHistoryService> {
	const serviceSpy = jasmine.createSpyObj<PaymentsHistoryService>('paymentsHistoryService', [
		'refreshPaymentOperationsStore',
		'refreshPaymentsHistory',
		'paymentOperationAsHistoryRecord',
	]);

	serviceSpy.refreshPaymentsHistory.and.returnValue(of([sampleHistoryRecord]));
	serviceSpy.paymentOperationAsHistoryRecord.and.returnValue(sampleHistoryRecord);

	return serviceSpy;
}

const accountingFeatureProviders: Array<Type<unknown>> = [
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
];

const sampleAccountId = '24a07833-5cf5-4885-b09d-32c089fac4dd';
const sampleOperationId = '0879167a-a6e8-4518-9850-4dd87a4e5be6';
const sampleCategoryId = '3b2a138e-f575-425a-8650-a309480a6ece';
const sampleContractorId = 'a249b2e9-edf0-45f2-a274-92ac310d4008';

const sampleAccount: IPaymentAccountModel = {
	key: Guid.parse(sampleAccountId),
	type: AccountTypes.Virtual,
	currency: 'BYN',
	balance: 64.5,
	emitter: 'Primary wallet',
	description: 'Household budget',
};

const sampleAccountEntities: IPaymentAccountEntity[] = [
	{
		key: sampleAccountId,
		accountType: AccountTypes.Virtual,
		currency: sampleAccount.currency,
		balance: sampleAccount.balance,
		agent: sampleAccount.emitter,
		description: sampleAccount.description,
	},
];

const sampleCategory: ICategoryModel = {
	key: Guid.parse(sampleCategoryId),
	operationType: 1,
	nameNodes: ['salary'],
};

const sampleContractor: IContractorModel = {
	key: Guid.parse(sampleContractorId),
	nameNodes: ['employer'],
};

const sampleOperation: IPaymentOperationModel = {
	key: Guid.parse(sampleOperationId),
	paymentAccountId: Guid.parse(sampleAccountId),
	contractorId: Guid.parse(sampleContractorId),
	categoryId: Guid.parse(sampleCategoryId),
	operationDate: new Date(2024, 0, 15),
	comment: 'income-comment',
	amount: 100,
	operationType: OperationTypes.Payment,
};

const sampleHistoryRecord: IPaymentRepresentationModel = {
	key: sampleOperation.key,
	operationDate: sampleOperation.operationDate,
	contractor: sampleContractor.nameNodes[0],
	category: sampleCategory.nameNodes[0],
	income: sampleOperation.amount,
	expense: 0,
	comment: sampleOperation.comment,
	balance: sampleAccount.balance,
	operationType: sampleOperation.operationType,
};

const sampleOperationResponse: IPaymentAccountCreateOrUpdateResponse = {
	paymentAccountId: sampleAccountId,
	paymentAccountBalance: sampleAccount.balance,
	paymentOperationId: sampleOperationId,
};
