import { DefaultContractorsProvider } from '../../../../../data/providers/accounting/contractors.provider';
import { IContractorModel } from '../../../../../domain/models/accounting/contractor.model.';
import { ContractorsDialogService } from '../../../../../presentation/accounting/services/counterparties-dialog.service';

describe('Contractors-dialog.component', () => {
	const matDialogSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

	const mockDialogContainer: DialogContainer<IContractorModel, IContractorModel> = {
		title: 'Contractor dialog tets',
		onSubmit: (payload: IContractorModel) => of(payload),
	};

	let contractorsProviderSpy: jasmine.SpyObj<DefaultContractorsProvider>;
	let dialogProviderSpy: jasmine.SpyObj<DialogProvider>;

	let sut: ContractorsDialogService;
});
