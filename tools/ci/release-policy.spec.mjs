import assert from 'node:assert/strict';
import test from 'node:test';

import { analyzeCommits } from '@semantic-release/commit-analyzer';
import { generateNotes } from '@semantic-release/release-notes-generator';

import releaseConfig from '../../release.config.mjs';
import {
	classifyReleaseType,
	RELEASE_NOTE_TYPES,
	RELEASE_NOTE_WRITER_OPTIONS,
	RELEASE_RULES,
	validatePullRequest,
} from './release-policy.mjs';

const SEMANTIC_RELEASE_CONFIG = {
	preset: 'conventionalcommits',
	parserOpts: { noteKeywords: ['BREAKING CHANGE', 'BREAKING CHANGES'] },
	releaseRules: RELEASE_RULES,
};
const SILENT_LOGGER = { log() {} };
const BASELINE_VERSION = '1.1.60';
const NEXT_TAG_BY_RELEASE_TYPE = Object.freeze({ patch: 'v1.1.61', minor: 'v1.2.0', major: 'v2.0.0' });

async function analyzeSyntheticCommits(messages) {
	return analyzeCommits(SEMANTIC_RELEASE_CONFIG, {
		commits: messages.map((message, index) => ({ hash: `synthetic-${index}`, message })),
		cwd: process.cwd(),
		logger: SILENT_LOGGER,
	});
}

test('classifies every release-producing Conventional Commit type', () => {
	assert.equal(classifyReleaseType(['fix(rates): correct persistence']), 'patch');
	assert.equal(classifyReleaseType(['perf(chart): reduce render work']), 'patch');
	assert.equal(classifyReleaseType(['revert: restore previous rate calculation']), 'patch');
	assert.equal(classifyReleaseType(['refactor(rates): simplify state initialization']), 'patch');
	assert.equal(classifyReleaseType(['chore(deps): update Angular dependencies']), 'patch');
	assert.equal(classifyReleaseType(['build(app): update builder configuration']), 'patch');
	assert.equal(classifyReleaseType(['ci(release): harden production build pipeline']), 'patch');
	assert.equal(classifyReleaseType(['feat(rates): add currency filtering']), 'minor');
	assert.equal(classifyReleaseType(['feat(api)!: replace rates endpoint']), 'major');
});

test('uses the highest semantic impact and recognizes breaking footers', () => {
	assert.equal(classifyReleaseType(['feat(rates): add filter', 'chore(deps): update dependencies']), 'minor');
	assert.equal(
		classifyReleaseType(['fix(rates): correct persistence', 'feat(rates): add filter', 'ci(release): update gate']),
		'minor'
	);
	assert.equal(
		classifyReleaseType([
			'chore(release): change release policy\n\nBREAKING CHANGE: legacy release workflow was removed',
		]),
		'major'
	);
});

test('does not release purely non-deployable commits', () => {
	assert.equal(classifyReleaseType(['docs: update release guide']), undefined);
	assert.equal(classifyReleaseType(['test: add coverage']), undefined);
	assert.equal(classifyReleaseType(['style: run formatter']), undefined);
	assert.equal(
		classifyReleaseType(['docs: update release guide', 'test: add coverage', 'style: run formatter']),
		undefined
	);
});

test('validates every supported branch prefix without using it to calculate a version', () => {
	const cases = [
		['feature/new-dashboard', 'feat(ui): add dashboard'],
		['feat/new-dashboard', 'feat(ui): add dashboard'],
		['bug/load-failure', 'fix(data): recover from a load failure'],
		['bugfix/load-failure', 'fix(data): recover from a load failure'],
		['fix/load-failure', 'fix(data): recover from a load failure'],
		['hotfix/load-failure', 'fix(data): recover from a load failure'],
		['perf/dashboard', 'perf(ui): improve dashboard rendering'],
		['refactor/mapping', 'refactor(data): simplify mapping'],
		['chore/tooling', 'chore: update tooling'],
		['docs/release-guide', 'docs: clarify release guide'],
		['test/release-policy', 'test(ci): cover release policy'],
		['ci/validation', 'ci: improve validation'],
		['build/bundling', 'build: update bundling configuration'],
		['tech/semantic-versioning-v2', 'chore(release): update semantic versioning'],
		['automation/deps/patch', 'chore(deps): apply safe patch updates'],
		['dependabot/npm_and_yarn/example-1.2.3', 'chore(deps): update example'],
		['renovate/example-1.x', 'chore(deps): update example'],
	];

	for (const [branch, title] of cases) assert.equal(validatePullRequest(branch, title), undefined, branch);
	assert.match(validatePullRequest('feature/new-dashboard', 'chore: reorganize tooling'), /expects a feat/);
	assert.match(validatePullRequest('unsupported/branch', 'chore: reorganize tooling'), /Unsupported branch name/);
});

test(`uses semantic-release commit analysis to prove outcomes from v${BASELINE_VERSION}`, async () => {
	const cases = [
		['fix(rates): correct persistence', 'patch', 'v1.1.61'],
		['perf(chart): reduce render work', 'patch', 'v1.1.61'],
		['revert: restore previous rate calculation', 'patch', 'v1.1.61'],
		['refactor(rates): simplify state initialization', 'patch', 'v1.1.61'],
		['chore(deps): update Angular dependencies', 'patch', 'v1.1.61'],
		['build(app): update builder configuration', 'patch', 'v1.1.61'],
		['ci(release): change production build pipeline', 'patch', 'v1.1.61'],
		['feat(rates): add currency filtering', 'minor', 'v1.2.0'],
		['docs: update release guide', null, null],
		['test(rates): add missing unit cases', null, null],
		['style: run formatter', null, null],
	];

	for (const [message, expectedType, expectedTag] of cases) {
		assert.equal(await analyzeSyntheticCommits([message]), expectedType, message);
		assert.equal(expectedType ? NEXT_TAG_BY_RELEASE_TYPE[expectedType] : null, expectedTag, message);
	}
});

test('does not increment a release when the post-tag commit range is empty', async () => {
	assert.equal(await analyzeSyntheticCommits([]), null);
});

test('uses the highest semantic-release impact across mixed commits', async () => {
	assert.equal(
		await analyzeSyntheticCommits([
			'feat(rates): add currency filtering',
			'chore(deps): update Angular dependencies',
		]),
		'minor'
	);
	assert.equal(
		await analyzeSyntheticCommits([
			'fix(rates): correct persistence',
			'feat(rates): add currency filtering',
			'ci(release): update gate',
		]),
		'minor'
	);
	assert.equal(
		await analyzeSyntheticCommits([
			'chore(release): update release policy\n\nBREAKING CHANGE: legacy release workflow was removed',
		]),
		'major'
	);
	assert.equal(
		await analyzeSyntheticCommits(['docs: update release guide', 'test: add coverage', 'style: run formatter']),
		null
	);
});

test('regresses PR #680 as a PATCH-producing application maintenance change', async () => {
	const releaseType = await analyzeSyntheticCommits(['chore: update semantic versioning']);

	assert.equal(releaseType, 'patch');
	assert.equal(NEXT_TAG_BY_RELEASE_TYPE[releaseType], 'v1.1.61');
});

test('generates visible release notes for application maintenance releases', async () => {
	const [, notesConfig] = releaseConfig.plugins[1];
	const notes = await generateNotes(notesConfig, {
		commits: [{ hash: 'synthetic', message: 'chore: update semantic versioning' }],
		lastRelease: { gitTag: 'v1.1.60' },
		nextRelease: { gitTag: 'v1.1.61', version: '1.1.61' },
		options: { repositoryUrl: 'https://github.com/Allmantool/h-budget.UI.git' },
		cwd: process.cwd(),
	});

	assert.match(notes, /### Maintenance/);
	assert.match(notes, /chore: update semantic versioning/);
});

test('uses the policy module in semantic-release configuration', () => {
	assert.deepEqual(RELEASE_RULES, [
		{ breaking: true, release: 'major' },
		{ type: 'feat', release: 'minor' },
		{ type: 'fix', release: 'patch' },
		{ type: 'perf', release: 'patch' },
		{ type: 'revert', release: 'patch' },
		{ type: 'refactor', release: 'patch' },
		{ type: 'chore', release: 'patch' },
		{ type: 'build', release: 'patch' },
		{ type: 'ci', release: 'patch' },
		{ type: 'docs', release: false },
		{ type: 'style', release: false },
		{ type: 'test', release: false },
	]);
	assert.deepEqual(releaseConfig.branches, ['master']);
	assert.equal(releaseConfig.tagFormat, 'v${version}');
	assert.deepEqual(
		releaseConfig.plugins.map(([plugin]) => plugin),
		['@semantic-release/commit-analyzer', '@semantic-release/release-notes-generator', '@semantic-release/github']
	);
	assert.deepEqual(
		RELEASE_NOTE_TYPES.filter(({ type }) => ['refactor', 'chore', 'build', 'ci'].includes(type)),
		[
			{ type: 'refactor', section: 'Refactoring', effect: 'bump' },
			{ type: 'chore', section: 'Maintenance', effect: 'bump' },
			{ type: 'build', section: 'Build System', effect: 'bump' },
			{ type: 'ci', section: 'Continuous Integration', effect: 'bump' },
		]
	);
	assert.deepEqual(releaseConfig.plugins[1][1].writerOpts, RELEASE_NOTE_WRITER_OPTIONS);
});
