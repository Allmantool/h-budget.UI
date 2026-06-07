import { environment } from 'environments/environment';

import { NgxsModuleOptions } from '@ngxs/store';

export const ngxsConfig: NgxsModuleOptions = {
	developmentMode: !environment.production,
	selectorOptions: {
		// These Selector Settings are recommended in preparation for NGXS v4
		// (See above for their effects)
		suppressErrors: false,
		injectContainerState: false,
	},
	compatibility: {
		strictContentSecurityPolicy: true,
	},
};
