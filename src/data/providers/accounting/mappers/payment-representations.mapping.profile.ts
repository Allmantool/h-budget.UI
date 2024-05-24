import { Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';

import _ from 'lodash';

import { MappingPair, Profile } from '@dynamic-mapper/mapper';
import { Select } from '@ngxs/store';
import { Observable } from 'rxjs';
import { Guid } from 'typescript-guid';

import { getActivePaymentAccount } from '../../../../app/modules/shared/store/states/accounting/selectors/payment-account.selector';
import { getCategories } from '../../../../app/modules/shared/store/states/handbooks/selectors/categories.selectors';
import { getContractors } from '../../../../app/modules/shared/store/states/handbooks/selectors/counterparties.selectors';
import { ICategoryModel } from '../../../../domain/models/accounting/category.model';
import { IContractorModel } from '../../../../domain/models/accounting/contractor.model.';
import { PaymentOperationTypes } from '../../../../domain/models/accounting/operation-types';
import { IPaymentAccountModel } from '../../../../domain/models/accounting/payment-account.model';
import { IPaymentHistoryModel } from '../../../../domain/models/accounting/payment-history.model';
import { IPaymentOperationModel } from '../../../../domain/models/accounting/payment-operation.model';
import { OperationTypes } from '../../../../domain/types/operation.types';
import { IPaymentRepresentationModel } from '../../../../presentation/accounting/models/operation-record';

export class PaymentRepresentationsMappingProfile extends Profile {
	static readonly PaymentHistoryToRepresentationModel = new MappingPair<
		IPaymentHistoryModel,
		IPaymentRepresentationModel
	>();

	static readonly PaymentOperationToRepresentationModel = new MappingPair<
		IPaymentOperationModel,
		IPaymentRepresentationModel
	>();

	@Select(getCategories)
	public categories$!: Observable<ICategoryModel[]>;

	@Select(getContractors)
	public contractors$!: Observable<IContractorModel[]>;

	@Select(getActivePaymentAccount)
	public activePaymentAccount$!: Observable<IPaymentAccountModel>;

	public activePaymentsAccountSignal: Signal<IPaymentAccountModel> = toSignal(this.activePaymentAccount$, {
		initialValue: {} as IPaymentAccountModel,
	});

	public categoriesSignal: Signal<ICategoryModel[]> = toSignal(this.categories$, {
		initialValue: {} as ICategoryModel[],
	});

	public contractorsSignal: Signal<IContractorModel[]> = toSignal(this.contractors$, {
		initialValue: {} as IContractorModel[],
	});

	constructor() {
		super();

		this.createMap(PaymentRepresentationsMappingProfile.PaymentHistoryToRepresentationModel, {
			key: opt => {
				opt.preCondition(src => !_.isNil(src.record.key));
				opt.mapFrom(src => src.record.key);
			},
			operationDate: opt => {
				opt.preCondition(src => !_.isNil(src.record.operationDate));
				opt.mapFrom(src => src.record.operationDate);
			},
			contractor: opt => {
				opt.preCondition(src => !_.isNil(src.record.contractorId));
				opt.mapFrom(src => this.getRepresentationView(this.getContractorById(src.record.contractorId)));
			},
			category: opt => {
				opt.preCondition(src => !_.isNil(src.record.categoryId));
				opt.mapFrom(src => this.getRepresentationView(this.getCategoryById(src.record.categoryId)));
			},
			comment: opt => {
				opt.preCondition(src => !_.isNil(src.record.comment));
				opt.mapFrom(src => src.record.comment);
			},
			income: opt => {
				opt.mapFrom(src =>
					this.calculateAmount(src.record.categoryId, src.record.operationType, src.record.amount) > 0
						? src.record.amount
						: 0
				);
			},
			expense: opt => {
				opt.mapFrom(src =>
					this.calculateAmount(src.record.categoryId, src.record.operationType, src.record.amount) < 0
						? -src.record.amount
						: 0
				);
			},
			balance: opt => {
				opt.preCondition(src => !_.isNil(src.balance));
				opt.mapFrom(src => src.balance);
			},
		});

		this.createMap(PaymentRepresentationsMappingProfile.PaymentOperationToRepresentationModel, {
			key: opt => {
				opt.preCondition(src => !_.isNil(src.key));
				opt.mapFrom(src => src.key);
			},
			operationDate: opt => {
				opt.preCondition(src => !_.isNil(src.operationDate));
				opt.mapFrom(src => src.operationDate);
			},
			contractor: opt => {
				opt.preCondition(src => !_.isNil(src.contractorId));
				opt.mapFrom(src => this.getRepresentationView(this.getContractorById(src.contractorId)));
			},
			category: opt => {
				opt.preCondition(src => !_.isNil(src.categoryId));
				opt.mapFrom(src => this.getRepresentationView(this.getCategoryById(src.categoryId)));
			},
			comment: opt => {
				opt.preCondition(src => !_.isNil(src.comment));
				opt.mapFrom(src => src.comment);
			},
			income: opt => {
				opt.mapFrom(src =>
					this.calculateAmount(src.categoryId, src.operationType, src.amount) > 0 ? src.amount : 0
				);
			},
			expense: opt => {
				opt.mapFrom(src =>
					this.calculateAmount(src.categoryId, src.operationType, src.amount) < 0 ? -src.amount : 0
				);
			},
		});
	}

	private getRepresentationView(handbookPayload: ICategoryModel | IContractorModel): string {
		if (_.isNil(handbookPayload)) {
			return 'N/A';
		}

		if (_.isNil(handbookPayload?.nameNodes)) {
			return handbookPayload.key.toString();
		}

		return handbookPayload.nameNodes.parseToTreeAsString();
	}

	private getCategoryById(id: Guid): ICategoryModel {
		return _.find(this.categoriesSignal(), c => c.key.equals(id))!;
	}

	private getContractorById(id: Guid): IContractorModel {
		return _.find(this.contractorsSignal(), c => c.key.equals(id))!;
	}

	private calculateAmount(categoryId: Guid, operationType: OperationTypes, amount: number): number {
		if (operationType === OperationTypes.Transfer) {
			return amount;
		}

		return this.getCategoryById(categoryId).operationType === PaymentOperationTypes.Income ? amount : -amount;
	}
}
