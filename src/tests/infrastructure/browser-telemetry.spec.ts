import { isBrowserTelemetryEndpointSupported } from '../../infrastructure/browser-telemetry';

describe('browser telemetry', () => {
	const securePageOrigin = 'https://home-ledger.example.test';

	it('does not allow an insecure OTLP endpoint from an HTTPS page', () => {
		expect(
			isBrowserTelemetryEndpointSupported('http://collector.example.test/v1/traces', securePageOrigin)
		).toBeFalse();
	});

	it('allows a secure OTLP endpoint from an HTTPS page', () => {
		expect(
			isBrowserTelemetryEndpointSupported('https://collector.example.test/v1/traces', securePageOrigin)
		).toBeTrue();
	});

	it('allows a same-origin relative endpoint from an HTTPS page', () => {
		expect(isBrowserTelemetryEndpointSupported('/otlp/v1/traces', securePageOrigin)).toBeTrue();
	});
});
