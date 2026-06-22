import { inject, Injectable } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { initializeStandaloneRootSettings, RootSettingsLoader } from './support/standalone-root-provider-test-config';
import { AppConfigurationService } from '../../app/modules/shared/services/app-configuration.service';
import { loadAppSettings } from '../../app-settings';
import { IAppSettingsModel } from '../../domain/models/app-settings.model';
import { environment } from '../../environments/environment';

class SettingsAssignmentRecorder {
	public assignments = 0;
	private currentSettings: IAppSettingsModel | undefined;

	get settings(): IAppSettingsModel | undefined {
		return this.currentSettings;
	}

	set settings(value: IAppSettingsModel | undefined) {
		this.assignments += 1;
		this.currentSettings = value;
	}
}

@Injectable()
class SettingsDependentRootService {
	private readonly appConfigurationService = inject(AppConfigurationService);

	public readonly settingsAtConstruction: IAppSettingsModel | undefined = this.appConfigurationService.settings;
}

describe('root provider settings parity', () => {
	describe('loadAppSettings cache', () => {
		const originalProduction = environment.production;
		const originalFetch = globalThis.fetch;
		let resolveFetch: (value: Response) => void = () => undefined;

		beforeAll(() => {
			environment.production = true;
			globalThis.fetch = jasmine
				.createSpy('fetch')
				.and.returnValue(new Promise<Response>(resolve => (resolveFetch = resolve)));
		});

		afterAll(() => {
			environment.production = originalProduction;
			globalThis.fetch = originalFetch;
		});

		it('shares one pending promise and one physical settings request', async () => {
			const settings: IAppSettingsModel = {
				gatewayHost: 'https://api.example.test',
				sentryDns: 'https://sentry.example.test',
				telemetryEndpoint: 'https://otel.example.test',
			};

			const firstLoad = loadAppSettings();
			const secondLoad = loadAppSettings();

			expect(firstLoad).toBe(secondLoad);
			expect(globalThis.fetch).toHaveBeenCalledOnceWith('assets/config.json');

			resolveFetch(new Response(JSON.stringify(settings), { status: 200 }));

			await expectAsync(firstLoad).toBeResolvedTo(settings);
			await expectAsync(secondLoad).toBeResolvedTo(settings);
		});
	});

	describe('standalone provider initializer', () => {
		let recorder: SettingsAssignmentRecorder;

		beforeEach(() => {
			TestBed.resetTestingModule();

			recorder = new SettingsAssignmentRecorder();
			TestBed.configureTestingModule({
				providers: [
					SettingsDependentRootService,
					{
						provide: AppConfigurationService,
						useValue: recorder,
					},
				],
			});
		});

		it('assigns the cached settings result exactly once before dependent root services are resolved', async () => {
			const settings: IAppSettingsModel = {
				gatewayHost: 'https://api.example.test',
			};

			await TestBed.runInInjectionContext(() =>
				initializeStandaloneRootSettings(() => Promise.resolve(settings))
			);

			const dependentService = TestBed.inject(SettingsDependentRootService);

			expect(recorder.assignments).toBe(1);
			expect(recorder.settings).toBe(settings);
			expect(dependentService.settingsAtConstruction).toBe(settings);
		});

		it('propagates loader rejection instead of converting it to successful initialization', async () => {
			const failure = new Error('settings failed');

			await expectAsync(
				TestBed.runInInjectionContext(() => initializeStandaloneRootSettings(() => Promise.reject(failure)))
			).toBeRejectedWith(failure);
			expect(recorder.assignments).toBe(0);
		});

		it('does not trigger a duplicate physical load after a simulated main.ts pre-load', async () => {
			const settings: IAppSettingsModel = {
				telemetryEndpoint: 'https://otel.example.test',
			};
			const loader = createCachedSettingsLoader(settings);

			const preBootstrapSettingsLoad = loader.load();
			const initializer = TestBed.runInInjectionContext(() => initializeStandaloneRootSettings(loader.load));

			await expectAsync(preBootstrapSettingsLoad).toBeResolvedTo(settings);
			await expectAsync(initializer).toBeResolvedTo(true);

			expect(loader.physicalLoads).toBe(1);
			expect(recorder.assignments).toBe(1);
			expect(recorder.settings).toBe(settings);
		});
	});
});

function createCachedSettingsLoader(settings: IAppSettingsModel): {
	readonly load: RootSettingsLoader;
	readonly physicalLoads: number;
} {
	let cachedPromise: Promise<IAppSettingsModel | undefined> | undefined;
	let physicalLoads = 0;

	return {
		load: () => {
			cachedPromise ??= Promise.resolve(settings).then(value => {
				physicalLoads += 1;

				return value;
			});

			return cachedPromise;
		},
		get physicalLoads() {
			return physicalLoads;
		},
	};
}
