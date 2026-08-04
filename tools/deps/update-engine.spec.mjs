import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { createUpdateEngine } from './update-engine.mjs';
import { candidateIsEligible, parseStableVersion, selectCandidate } from './semver-policy.mjs';

const candidate = (name, group = null) => ({
	name,
	group,
	fromVersion: '1.2.3',
	toVersion: '2.0.0',
	section: 'dependencies',
});

function run(candidates, failures = {}) {
	let installed = [];
	const baseline = [];
	const actions = {
		snapshot: () => [...installed],
		restore: snapshot => {
			installed = [...snapshot];
			return true;
		},
		apply: items => {
			installed = [...installed, ...items.map(item => item.name)];
		},
		resolve: label => result(failures[`resolve:${label}`]),
		verifyLock: items => result(failures[`lock:${items.map(item => item.name).join(',')}`]),
		validate: label => result(failures[`validate:${label}`]),
	};
	return createUpdateEngine(actions).run(candidates);
}

function result(failure) {
	return failure ? { ok: false, stage: failure, reason: failure } : { ok: true, stage: 'complete' };
}

test('patch mode selects only the highest stable patch', () => {
	const selected = selectCandidate({
		name: 'lodash',
		section: 'dependencies',
		spec: '^1.2.3',
		currentVersion: '1.2.3',
		versions: ['1.2.4-beta.1', '1.2.4', '1.2.5', '1.3.0', '2.0.0'],
		mode: 'patch',
		groups: [],
		metadataByVersion: {},
	});
	assert.equal(selected.toVersion, '1.2.5');
});

test('minor mode includes patch releases and selects the highest same-major version', () => {
	const selected = selectCandidate({
		name: 'lodash',
		section: 'dependencies',
		spec: '~1.2.3',
		currentVersion: '1.2.3',
		versions: ['1.2.4', '1.3.0', '1.7.2', '1.8.0-beta.1', '2.0.0'],
		mode: 'minor',
		groups: [],
		metadataByVersion: {},
	});
	assert.equal(selected.toVersion, '1.7.2');
	assert.equal(selected.to, '~1.7.2');
});

test('major mode is explicit and can select a policy-permitted major', () => {
	const selected = selectCandidate({
		name: '@types/lodash',
		section: 'devDependencies',
		spec: '^1.2.3',
		currentVersion: '1.2.3',
		versions: ['1.9.9', '2.0.0', '3.4.0', '4.0.0-next.1'],
		mode: 'major',
		groups: [],
		metadataByVersion: {},
	});
	assert.equal(selected.toVersion, '3.4.0');
	assert.equal(selected.updateType, 'major');
});

test('semver boundaries reject cross-mode candidates and prereleases', () => {
	const current = parseStableVersion('1.2.3');
	assert.equal(candidateIsEligible(current, parseStableVersion('1.2.4'), 'patch'), true);
	assert.equal(candidateIsEligible(current, parseStableVersion('1.3.0'), 'patch'), false);
	assert.equal(candidateIsEligible(current, parseStableVersion('1.9.7'), 'minor'), true);
	assert.equal(candidateIsEligible(current, parseStableVersion('2.0.0'), 'minor'), false);
	assert.equal(parseStableVersion('2.0.0-next.4'), null);
});

test('deprecated and unsupported targets are skipped', () => {
	const deprecated = selectCandidate({
		name: 'lodash',
		section: 'dependencies',
		spec: '^1.2.3',
		currentVersion: '1.2.3',
		versions: ['1.2.4'],
		mode: 'patch',
		groups: [],
		metadataByVersion: { '1.2.4': { deprecated: true } },
	});
	const unsupported = selectCandidate({
		name: 'lodash',
		section: 'dependencies',
		spec: 'workspace:*',
		currentVersion: '1.2.3',
		versions: ['1.2.4'],
		mode: 'patch',
		groups: [],
		metadataByVersion: {},
	});
	assert.equal(deprecated.kind, 'skipped');
	assert.equal(unsupported.reason, 'unsupported dependency specification');
});

test('bulk success accepts every candidate without fallback', () => {
	const outcome = run([candidate('A'), candidate('B')]);
	assert.equal(outcome.status, 'completed');
	assert.deepEqual(
		outcome.accepted.map(item => item.name),
		['A', 'B']
	);
	assert.equal(outcome.strategy, 'bulk');
});

test('bulk resolution failure falls back to a deterministic compatible subset', () => {
	const outcome = run([candidate('A'), candidate('B')], {
		'resolve:bulk': 'peer-conflict',
		'resolve:unit-B': 'peer-conflict',
	});
	assert.equal(outcome.status, 'completed-with-rejections');
	assert.deepEqual(
		outcome.accepted.map(item => item.name),
		['A']
	);
	assert.equal(outcome.rejected[0].failedStage, 'peer-conflict');
});

test('engine conflict, lock mismatch, clean install, graph, and repository failures reject and restore', () => {
	const scenarios = [
		['engine-conflict', { 'resolve:bulk': 'engine-conflict', 'resolve:unit-A': 'engine-conflict' }],
		['lockfile-target-mismatch', { 'lock:A': 'lockfile-target-mismatch' }],
		['clean-install', { 'validate:bulk': 'clean-install', 'validate:unit-A': 'clean-install' }],
		[
			'dependency-graph-validation',
			{ 'validate:bulk': 'dependency-graph-validation', 'validate:unit-A': 'dependency-graph-validation' },
		],
		[
			'repository-validation:build',
			{ 'validate:bulk': 'repository-validation:build', 'validate:unit-A': 'repository-validation:build' },
		],
	];
	for (const [failure, failures] of scenarios) {
		const outcome = run([candidate('A')], failures);
		assert.equal(outcome.status, 'completed-with-rejections', failure);
		assert.equal(outcome.rejected[0].failedStage, failure);
	}
});

test('final accumulated-set failure restores the original baseline', () => {
	const outcome = run([candidate('A'), candidate('B')], {
		'resolve:bulk': 'bulk-conflict',
		'validate:final-accumulated': 'repository-validation:test',
	});
	assert.equal(outcome.status, 'rolled-back');
	assert.deepEqual(outcome.accepted, []);
	assert.equal(outcome.rollback, true);
});

test('an atomic group is never accepted partially', () => {
	const outcome = run([candidate('A1', 'framework'), candidate('A2', 'framework'), candidate('A3', 'framework')], {
		'resolve:bulk': 'group-conflict',
		'resolve:unit-framework': 'group-conflict',
	});
	assert.equal(outcome.accepted.length, 0);
	assert.equal(outcome.rejected.length, 3);
});

test('major framework groups are deferred to specialized migration policy', () => {
	const selected = selectCandidate({
		name: '@angular/core',
		section: 'dependencies',
		spec: '21.2.0',
		currentVersion: '21.2.0',
		versions: ['22.0.0'],
		mode: 'major',
		groups: [{ name: 'angular', packages: ['@angular/core'], manualMajor: true }],
		metadataByVersion: {},
	});
	assert.equal(selected.kind, 'skipped');
	assert.match(selected.reason, /specialized migration/);
});

test('conflicting CLI modes fail instead of silently choosing one', () => {
	const script = fileURLToPath(new URL('./safe-update.mjs', import.meta.url));
	const result = spawnSync(process.execPath, [script, '--patch', '--minor'], { encoding: 'utf8' });
	assert.notEqual(result.status, 0);
	assert.match(result.stderr, /select exactly one mode/);
});
