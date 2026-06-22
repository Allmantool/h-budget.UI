import { ErrorHandler } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { createStandaloneRootTestProviders } from './support/standalone-root-provider-test-config';

describe('root provider Sentry ErrorHandler parity', () => {
	it('resolves the standalone scaffold ErrorHandler from the configured Sentry handler factory', () => {
		const handleError = jasmine.createSpy('handleError');
		const sentryErrorHandler: ErrorHandler = { handleError };

		configureRootProviders(false, () => sentryErrorHandler);

		const resolvedHandler = TestBed.inject(ErrorHandler);
		const error = new Error('component failure');

		resolvedHandler.handleError(error);

		expect(resolvedHandler).toBe(sentryErrorHandler);
		expect(handleError).toHaveBeenCalledOnceWith(error);
	});

	it('keeps a single root ErrorHandler provider in development mode', () => {
		const sentryErrorHandler = jasmine.createSpyObj<ErrorHandler>('SentryErrorHandler', ['handleError']);

		configureRootProviders(false, () => sentryErrorHandler);

		expect(TestBed.inject(ErrorHandler)).toBe(sentryErrorHandler);
	});

	it('keeps the same ErrorHandler provider behavior in production mode', () => {
		const sentryErrorHandler = jasmine.createSpyObj<ErrorHandler>('SentryErrorHandler', ['handleError']);

		configureRootProviders(true, () => sentryErrorHandler);

		expect(TestBed.inject(ErrorHandler)).toBe(sentryErrorHandler);
	});

	function configureRootProviders(production: boolean, createErrorHandler: () => ErrorHandler): void {
		TestBed.resetTestingModule();
		TestBed.configureTestingModule({
			providers: [
				...createStandaloneRootTestProviders({
					production,
					includeAnimations: false,
					loadSettings: () => Promise.resolve(undefined),
					createErrorHandler,
				}),
			],
		});
	}
});
