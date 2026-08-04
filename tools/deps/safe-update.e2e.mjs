import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import {
	assertStateShape,
	createUpdaterFixture,
	fingerprintFiles,
	fixtureLogFiles,
	readLock,
	readManifest,
	readState,
	runFixtureNpm,
	runUpdater,
	startUpdater,
} from './safe-update-fixture.mjs';

const packageVersions = (name, versions) => ({
	name,
	versions: versions.map(version => (typeof version === 'string' ? { version } : version)),
});

test('PATCH E2E selects the latest stable patch and validates the updated fixture', async context => {
	const fixture = await createUpdaterFixture(context, {
		dependencies: { lodash: '1.0.0' },
		packages: [packageVersions('lodash', ['1.0.0', '1.0.1', '1.1.0', '2.0.0'])],
	});
	const result = await runUpdater(fixture, 'patch');
	assert.equal(result.status, 0, processOutput(result));
	assertSelected(fixture, 'lodash', '1.0.1');
	await assertFixtureNpmValidation(fixture);
	assertLogStages(fixture, ['dependency-resolution', 'clean-install']);
});

test('MINOR E2E selects the latest stable same-major version', async context => {
	const fixture = await createUpdaterFixture(context, {
		dependencies: { lodash: '1.0.0' },
		packages: [packageVersions('lodash', ['1.0.0', '1.0.1', '1.1.0', '1.5.2', '2.0.0'])],
	});
	const result = await runUpdater(fixture, 'minor');
	assert.equal(result.status, 0, result.stderr);
	assertSelected(fixture, 'lodash', '1.5.2');
	await assertFixtureNpmValidation(fixture);
});

test('MINOR E2E keeps patch releases eligible when no newer minor exists', async context => {
	const fixture = await createUpdaterFixture(context, {
		dependencies: { lodash: '1.0.0' },
		packages: [packageVersions('lodash', ['1.0.0', '1.0.1', '2.0.0'])],
	});
	const result = await runUpdater(fixture, 'minor');
	assert.equal(result.status, 0, result.stderr);
	assertSelected(fixture, 'lodash', '1.0.1');
});

test('MAJOR E2E selects an explicitly eligible generic major and blocks framework majors', async context => {
	const fixture = await createUpdaterFixture(context, {
		dependencies: { '@types/lodash': '1.0.0' },
		packages: [packageVersions('@types/lodash', ['1.0.0', '1.0.1', '1.4.0', '2.0.0', '3.0.0'])],
	});
	const result = await runUpdater(fixture, 'major');
	assert.equal(result.status, 0, result.stderr);
	assertSelected(fixture, '@types/lodash', '3.0.0');
	await assertFixtureNpmValidation(fixture);

	const frameworkFixture = await createUpdaterFixture(context, {
		dependencies: { '@angular/core': '21.0.0' },
		packages: [packageVersions('@angular/core', ['21.0.0', '22.0.0'])],
	});
	const frameworkResult = await runUpdater(frameworkFixture, 'major');
	assert.equal(frameworkResult.status, 0, frameworkResult.stderr);
	const frameworkState = readState(frameworkFixture);
	assertStateShape(frameworkState);
	assert.equal(frameworkState.status, 'no-updates');
	assert.match(frameworkState.skipped[0].reason, /specialized migration/);
});

test('peer and engine conflicts reject the candidate and restore the baseline', async context => {
	const peerFixture = await createUpdaterFixture(context, {
		dependencies: { lodash: '1.0.0', 'peer-host': '1.0.0' },
		packages: [
			packageVersions('lodash', ['1.0.0', { version: '1.0.1', peerDependencies: { 'peer-host': '^2.0.0' } }]),
			packageVersions('peer-host', ['1.0.0']),
		],
	});
	const peerBaseline = fingerprintFiles(peerFixture);
	const peerResult = await runUpdater(peerFixture, 'patch');
	assert.equal(peerResult.status, 0, peerResult.stderr);
	assertRejectedAndRestored(peerFixture, peerBaseline, 'dependency-resolution');
	assertLogStages(peerFixture, ['dependency-resolution']);
	assert.match(readFirstLogContaining(peerFixture, 'dependency-resolution'), /ERESOLVE|peer/i);

	const engineFixture = await createUpdaterFixture(context, {
		dependencies: { lodash: '1.0.0' },
		packages: [packageVersions('lodash', ['1.0.0', { version: '1.0.1', engines: { node: '<0.0.1' } }])],
	});
	const engineBaseline = fingerprintFiles(engineFixture);
	const engineResult = await runUpdater(engineFixture, 'patch');
	assert.equal(engineResult.status, 0, engineResult.stderr);
	assertRejectedAndRestored(engineFixture, engineBaseline, 'dependency-resolution');
	assertLogStages(engineFixture, ['dependency-resolution']);
	assert.match(readFirstLogContaining(engineFixture, 'dependency-resolution'), /EBADENGINE|engine/i);
});

test('registry metadata failure is non-zero, recorded, and leaves dependency files unchanged', async context => {
	const fixture = await createUpdaterFixture(context, {
		dependencies: { lodash: '1.0.0' },
		packages: [packageVersions('lodash', ['1.0.0', '1.0.1'])],
	});
	const baseline = fingerprintFiles(fixture);
	fixture.registry.failureName = 'lodash';
	const result = await runUpdater(fixture, 'patch');
	assert.equal(result.status, 2, result.stderr);
	const state = readState(fixture);
	assertStateShape(state);
	assert.equal(state.status, 'failed');
	assert.equal(state.discoveryFailures.length, 1);
	assert.match(state.discoveryFailures[0].reason, /registry query failed/);
	assert.equal(fingerprintFiles(fixture), baseline);
	assertLogStages(fixture, ['registry-lodash']);
});

test('validation failure after lockfile mutation restores the byte-identical baseline', async context => {
	const fixture = await createUpdaterFixture(context, {
		dependencies: { lodash: '1.0.0' },
		packages: [packageVersions('lodash', ['1.0.0', '1.0.1'])],
		validationScript: 'node -e "process.exit(7)"',
	});
	const baseline = fingerprintFiles(fixture);
	const result = await runUpdater(fixture, 'patch');
	assert.equal(result.status, 0, result.stderr);
	assertRejectedAndRestored(fixture, baseline, 'repository-validation:fixture:validate');
	assertLogStages(fixture, ['clean-install', 'repository-validation_fixture_validate']);
});

test('final accumulated validation failure rolls back the complete original baseline', async context => {
	const fixture = await createUpdaterFixture(context, {
		dependencies: { lodash: '1.0.0', uuid: '1.0.0' },
		packages: [packageVersions('lodash', ['1.0.0', '1.0.1']), packageVersions('uuid', ['1.0.0', '1.0.1'])],
		validationScript:
			'node -e "process.exit([\'bulk\', \'final-accumulated\'].includes(process.env.SAFE_NPM_UPDATE_LABEL) ? 7 : 0)"',
	});
	const baseline = fingerprintFiles(fixture);
	const result = await runUpdater(fixture, 'patch');
	assert.equal(result.status, 1, result.stderr);
	const state = readState(fixture);
	assertStateShape(state);
	assert.equal(state.status, 'rolled-back');
	assert.equal(state.rollback, true);
	assert.equal(state.accepted.length, 0);
	assert.equal(state.rejected.length, 2);
	assert.equal(state.validation.stage, 'repository-validation:fixture:validate');
	assert.equal(fingerprintFiles(fixture), baseline);
	assertLogStages(fixture, ['final-accumulated-clean-install', 'final-accumulated-repository-validation_fixture_validate']);
});

test('concurrent updater process preserves the active lock and state ownership', async context => {
	const fixture = await createUpdaterFixture(context, {
		dependencies: { lodash: '1.0.0' },
		packages: [packageVersions('lodash', ['1.0.0', '1.0.1'])],
		validationScript:
			'node -e "require(\'node:fs\').writeFileSync(\'validation-ready\', \'ready\'); setTimeout(() => {}, 2500)"',
	});
	const first = startUpdater(fixture, 'patch');
	await waitForFile(join(fixture.directory, 'validation-ready'));
	const beforeSecond = fingerprintFiles(fixture);
	const second = await runUpdater(fixture, 'patch');
	assert.equal(second.status, 3, second.stderr);
	assert.equal(fingerprintFiles(fixture), beforeSecond);
	const contentionFiles = readdirSync(join(fixture.directory, '.dependency-upgrade')).filter(file =>
		file.startsWith('lock-contention-')
	);
	assert.equal(contentionFiles.length, 1);
	const contentionState = JSON.parse(
		readFileSync(join(fixture.directory, '.dependency-upgrade', contentionFiles[0]), 'utf8')
	);
	assertStateShape(contentionState);
	assert.equal(contentionState.status, 'lock-contention');
	assert.equal(existsSync(join(fixture.directory, '.dependency-upgrade', 'dependency-update.lock')), true);
	const firstResult = await waitForExit(first);
	assert.equal(firstResult.code, 0, firstResult.stderr);
	assert.equal(existsSync(join(fixture.directory, '.dependency-upgrade', 'dependency-update.lock')), false);
	assertSelected(fixture, 'lodash', '1.0.1');
	const futureResult = await runUpdater(fixture, 'patch', { SAFE_NPM_ALLOW_DIRTY: '1' });
	assert.equal(futureResult.status, 0, futureResult.stderr);
});

function assertSelected(fixture, name, version) {
	const manifest = readManifest(fixture);
	const lock = readLock(fixture);
	const state = readState(fixture);
	assertStateShape(state);
	assert.equal(manifest.dependencies[name], version);
	assert.equal(lock.packages[`node_modules/${name}`].version, version);
	assert.equal(state.accepted.length, 1);
	assert.equal(state.accepted[0].name, name);
	assert.equal(state.accepted[0].toVersion, version);
	assert.equal(state.status, 'completed');
}

async function assertFixtureNpmValidation(fixture) {
	await runFixtureNpm(fixture, ['ci']);
	await runFixtureNpm(fixture, ['ls', '--depth=0']);
}

function assertRejectedAndRestored(fixture, baseline, stage) {
	const state = readState(fixture);
	assertStateShape(state);
	assert.equal(state.status, 'completed-with-rejections');
	assert.equal(state.accepted.length, 0);
	assert.equal(state.rejected.length, 1);
	assert.equal(state.rejected[0].failedStage, stage);
	assert.equal(state.rollback, true);
	assert.equal(fingerprintFiles(fixture), baseline);
}

function assertLogStages(fixture, stages) {
	const files = fixtureLogFiles(fixture);
	for (const stage of stages) assert.ok(files.some(file => file.includes(stage)), `missing log for ${stage}`);
}

function readFirstLogContaining(fixture, stage) {
	const file = fixtureLogFiles(fixture).find(candidate => candidate.includes(stage));
	assert.ok(file, `missing log for ${stage}`);
	return readFileSync(file, 'utf8');
}

async function waitForFile(file) {
	for (let attempt = 0; attempt < 300; attempt += 1) {
		if (existsSync(file)) return;
		await new Promise(resolve => setTimeout(resolve, 50));
	}
	throw new Error(`timed out waiting for ${file}`);
}

function waitForExit(child) {
	return new Promise(resolve => {
		let stderr = '';
		child.stderr.on('data', chunk => {
			stderr += chunk;
		});
		child.once('exit', code => resolve({ code, stderr }));
	});
}

function processOutput(result) {
	return `${result.stdout ?? ''}\n${result.stderr ?? ''}`;
}
