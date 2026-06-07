import { ZoneContextManager } from '@opentelemetry/context-zone-peer-dep';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { DocumentLoadInstrumentation } from '@opentelemetry/instrumentation-document-load';
import { FetchInstrumentation } from '@opentelemetry/instrumentation-fetch';
import { UserInteractionInstrumentation } from '@opentelemetry/instrumentation-user-interaction';
import { XMLHttpRequestInstrumentation } from '@opentelemetry/instrumentation-xml-http-request';
import { defaultResource, resourceFromAttributes } from '@opentelemetry/resources';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { WebTracerProvider } from '@opentelemetry/sdk-trace-web';
import { SEMRESATTRS_DEPLOYMENT_ENVIRONMENT, SEMRESATTRS_SERVICE_NAME } from '@opentelemetry/semantic-conventions';

import { IAppSettingsModel } from '../domain/models/app-settings.model';
import { environment } from '../environments/environment';

let tracingInitialized = false;

export function initializeBrowserTracing(settings?: IAppSettingsModel): void {
	if (tracingInitialized || !settings?.telemetryEndpoint) {
		return;
	}

	const telemetryUrl = new URL(settings.telemetryEndpoint, window.location.origin).toString();
	const ignoredTelemetryUrl = new RegExp(`^${escapeRegExp(telemetryUrl)}`);
	const propagateTraceUrls = buildPropagateTraceUrls(settings);

	const provider = new WebTracerProvider({
		resource: defaultResource().merge(
			resourceFromAttributes({
				[SEMRESATTRS_SERVICE_NAME]: 'homebudget-ui',
				[SEMRESATTRS_DEPLOYMENT_ENVIRONMENT]: environment.production ? 'production' : 'development',
			})
		),
		spanProcessors: [
			new BatchSpanProcessor(
				new OTLPTraceExporter({
					url: telemetryUrl,
				})
			),
		],
	});

	provider.register({
		contextManager: new ZoneContextManager(),
	});

	registerInstrumentations({
		instrumentations: [
			new DocumentLoadInstrumentation(),
			new UserInteractionInstrumentation(),
			new FetchInstrumentation({
				ignoreUrls: [ignoredTelemetryUrl],
				propagateTraceHeaderCorsUrls: propagateTraceUrls,
				clearTimingResources: true,
			}),
			new XMLHttpRequestInstrumentation({
				ignoreUrls: [ignoredTelemetryUrl],
				propagateTraceHeaderCorsUrls: propagateTraceUrls,
			}),
		],
	});

	tracingInitialized = true;
}

function buildPropagateTraceUrls(settings: IAppSettingsModel): Array<string | RegExp> {
	const urls: Array<string | RegExp> = [/^\/(?!\/)/];
	const gatewayOrigin = getOrigin(settings.gatewayHost);

	if (gatewayOrigin) {
		urls.push(gatewayOrigin);
	}

	return urls;
}

function getOrigin(url?: string): string | undefined {
	if (!url) {
		return undefined;
	}

	try {
		return new URL(url, window.location.origin).origin;
	} catch {
		return undefined;
	}
}

function escapeRegExp(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
