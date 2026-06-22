import { loadAppSettings } from '../../app-settings';
import {
	ApplicationBootstrapDependencies,
	bootstrapNgModuleApplication,
	createProductionBootstrapDependencies,
	handleBootstrapError,
	initializeSentryForSettings,
	runApplicationBootstrap,
	SentryBootstrapSettings,
	shouldInitializeSentryFromSettings,
} from '../../application-bootstrap';
import { IAppSettingsModel } from '../../domain/models/app-settings.model';
import { initializeBrowserTracing } from '../../infrastructure/browser-telemetry';

describe('application bootstrap orchestration', () => {
	it('runs the pre-bootstrap sequence in the current success order', async () => {
		const events: string[] = [];
		const settings: SentryBootstrapSettings = {
			gatewayHost: 'https://api.example.test',
			sentryDns: 'https://sentry.example.test',
			telemetryEndpoint: 'https://otel.example.test',
		};
		const bootstrapResult = { bootstrapped: true };

		const result = await runApplicationBootstrap({
			loadSettings: () => {
				events.push('settings load starts');

				return Promise.resolve().then(() => {
					events.push('settings resolve');

					return settings;
				});
			},
			shouldInitializeSentry: candidateSettings => {
				events.push('sentry condition evaluated');

				return shouldInitializeSentryFromSettings(candidateSettings);
			},
			initializeSentry: sentrySettings => {
				events.push('sentry initializes');
				expect(sentrySettings).toBe(settings);
			},
			initializeTracing: tracingSettings => {
				events.push('tracing initializes');
				expect(tracingSettings).toBe(settings);
			},
			bootstrapAngular: () => {
				events.push('angular bootstrap starts');

				return Promise.resolve(bootstrapResult);
			},
			handleBootstrapError: error => {
				events.push('error handled');
				fail(`Unexpected bootstrap error: ${String(error)}`);
			},
		});

		events.push('orchestration completes');

		expect(result).toBe(bootstrapResult);
		expect(events).toEqual([
			'settings load starts',
			'settings resolve',
			'sentry condition evaluated',
			'sentry initializes',
			'tracing initializes',
			'angular bootstrap starts',
			'orchestration completes',
		]);
	});

	it('skips Sentry when the current settings condition disables it and still bootstraps Angular', async () => {
		const events: string[] = [];
		const settings: IAppSettingsModel = {
			telemetryEndpoint: 'https://otel.example.test',
		};

		await runApplicationBootstrap({
			loadSettings: () => {
				events.push('settings load starts');

				return Promise.resolve(settings);
			},
			shouldInitializeSentry: candidateSettings => {
				events.push('sentry condition evaluated');

				return shouldInitializeSentryFromSettings(candidateSettings);
			},
			initializeSentry: () => {
				events.push('sentry initializes');
				fail('Sentry initialization should be skipped when sentryDns is absent.');
			},
			initializeTracing: tracingSettings => {
				events.push('tracing initializes');
				expect(tracingSettings).toBe(settings);
			},
			bootstrapAngular: () => {
				events.push('angular bootstrap starts');

				return Promise.resolve('bootstrapped');
			},
			handleBootstrapError: error => {
				events.push('error handled');
				fail(`Unexpected bootstrap error: ${String(error)}`);
			},
		});

		expect(events).toEqual([
			'settings load starts',
			'sentry condition evaluated',
			'tracing initializes',
			'angular bootstrap starts',
		]);
	});

	it('handles settings rejection before Sentry, tracing, or Angular bootstrap starts', async () => {
		const settingsFailure = new Error('settings failed');
		const events: string[] = [];

		const result = await runApplicationBootstrap({
			loadSettings: () => {
				events.push('settings load starts');

				return Promise.reject(settingsFailure);
			},
			shouldInitializeSentry: (_candidateSettings): _candidateSettings is SentryBootstrapSettings => {
				events.push('sentry condition evaluated');

				return false;
			},
			initializeSentry: () => events.push('sentry initializes'),
			initializeTracing: () => events.push('tracing initializes'),
			bootstrapAngular: () => {
				events.push('angular bootstrap starts');

				return Promise.resolve('bootstrapped');
			},
			handleBootstrapError: error => {
				events.push('error handled');
				expect(error).toBe(settingsFailure);
			},
		});

		expect(result).toBeUndefined();
		expect(events).toEqual(['settings load starts', 'error handled']);
	});

	it('handles synchronous Sentry initialization failure and stops tracing and Angular bootstrap', async () => {
		const sentryFailure = new Error('sentry failed');
		const events: string[] = [];

		const result = await runApplicationBootstrap({
			...createEnabledNoErrorDependencies(events),
			initializeSentry: () => {
				events.push('sentry initializes');
				throw sentryFailure;
			},
			handleBootstrapError: error => {
				events.push('error handled');
				expect(error).toBe(sentryFailure);
			},
		});

		expect(result).toBeUndefined();
		expect(events).toEqual([
			'settings load starts',
			'sentry condition evaluated',
			'sentry initializes',
			'error handled',
		]);
	});

	it('handles synchronous tracing initialization failure and stops Angular bootstrap', async () => {
		const tracingFailure = new Error('tracing failed');
		const events: string[] = [];

		const result = await runApplicationBootstrap({
			...createEnabledNoErrorDependencies(events),
			initializeTracing: () => {
				events.push('tracing initializes');
				throw tracingFailure;
			},
			handleBootstrapError: error => {
				events.push('error handled');
				expect(error).toBe(tracingFailure);
			},
		});

		expect(result).toBeUndefined();
		expect(events).toEqual([
			'settings load starts',
			'sentry condition evaluated',
			'sentry initializes',
			'tracing initializes',
			'error handled',
		]);
	});

	it('handles Angular NgModule bootstrap rejection after settings, Sentry, and tracing run', async () => {
		const bootstrapFailure = new Error('bootstrap failed');
		const events: string[] = [];
		let handledErrors = 0;

		const result = await runApplicationBootstrap({
			...createEnabledNoErrorDependencies(events),
			bootstrapAngular: () => {
				events.push('angular bootstrap starts');

				return Promise.reject(bootstrapFailure);
			},
			handleBootstrapError: error => {
				handledErrors += 1;
				events.push('error handled');
				expect(error).toBe(bootstrapFailure);
			},
		});

		expect(result).toBeUndefined();
		expect(handledErrors).toBe(1);
		expect(events).toEqual([
			'settings load starts',
			'sentry condition evaluated',
			'sentry initializes',
			'tracing initializes',
			'angular bootstrap starts',
			'error handled',
		]);
	});

	it('runs each successful stage no more than once per orchestration call', async () => {
		let settingsLoads = 0;
		let sentryConditionChecks = 0;
		let sentryInitializations = 0;
		let tracingInitializations = 0;
		let angularBootstraps = 0;
		let handledErrors = 0;
		const settings: IAppSettingsModel = {
			sentryDns: 'https://sentry.example.test',
		};

		await runApplicationBootstrap({
			loadSettings: () => {
				settingsLoads += 1;

				return Promise.resolve(settings);
			},
			shouldInitializeSentry: candidateSettings => {
				sentryConditionChecks += 1;

				return shouldInitializeSentryFromSettings(candidateSettings);
			},
			initializeSentry: () => {
				sentryInitializations += 1;
			},
			initializeTracing: () => {
				tracingInitializations += 1;
			},
			bootstrapAngular: () => {
				angularBootstraps += 1;

				return Promise.resolve('bootstrapped');
			},
			handleBootstrapError: error => {
				handledErrors += 1;
				fail(`Unexpected bootstrap error: ${String(error)}`);
			},
		});

		expect(settingsLoads).toBe(1);
		expect(sentryConditionChecks).toBe(1);
		expect(sentryInitializations).toBe(1);
		expect(tracingInitializations).toBe(1);
		expect(angularBootstraps).toBe(1);
		expect(handledErrors).toBe(0);
	});
});

describe('production application bootstrap dependencies', () => {
	it('wires the production adapters without invoking real Angular bootstrap', () => {
		const dependencies = createProductionBootstrapDependencies();

		expect(dependencies.loadSettings).toBe(loadAppSettings);
		expect(dependencies.shouldInitializeSentry).toBe(shouldInitializeSentryFromSettings);
		expect(dependencies.initializeSentry).toBe(initializeSentryForSettings);
		expect(dependencies.initializeTracing).toBe(initializeBrowserTracing);
		expect(dependencies.bootstrapAngular).toBe(bootstrapNgModuleApplication);
		expect(dependencies.handleBootstrapError).toBe(handleBootstrapError);
	});

	it('keeps the current Sentry enabled condition based on sentryDns truthiness', () => {
		expect(shouldInitializeSentryFromSettings(undefined)).toBeFalse();
		expect(shouldInitializeSentryFromSettings({})).toBeFalse();
		expect(shouldInitializeSentryFromSettings({ sentryDns: '' })).toBeFalse();
		expect(shouldInitializeSentryFromSettings({ sentryDns: 'https://sentry.example.test' })).toBeTrue();
	});

	it('logs bootstrap failures to console.error with the original error object', () => {
		const error = new Error('bootstrap failed');
		const consoleError = spyOn(console, 'error');

		handleBootstrapError(error);

		expect(consoleError).toHaveBeenCalledOnceWith(error);
	});
});

function createEnabledNoErrorDependencies(events: string[]): ApplicationBootstrapDependencies {
	const settings: IAppSettingsModel = {
		sentryDns: 'https://sentry.example.test',
		telemetryEndpoint: 'https://otel.example.test',
	};

	return {
		loadSettings: () => {
			events.push('settings load starts');

			return Promise.resolve(settings);
		},
		shouldInitializeSentry: candidateSettings => {
			events.push('sentry condition evaluated');

			return shouldInitializeSentryFromSettings(candidateSettings);
		},
		initializeSentry: () => {
			events.push('sentry initializes');
		},
		initializeTracing: () => {
			events.push('tracing initializes');
		},
		bootstrapAngular: () => {
			events.push('angular bootstrap starts');

			return Promise.resolve('bootstrapped');
		},
		handleBootstrapError: error => {
			events.push('error handled');
			fail(`Unexpected bootstrap error: ${String(error)}`);
		},
	};
}
