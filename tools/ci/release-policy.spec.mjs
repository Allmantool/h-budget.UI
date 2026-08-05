import assert from 'node:assert/strict';
import test from 'node:test';

import { analyzeCommits } from '@semantic-release/commit-analyzer';

import releaseConfig from '../../release.config.mjs';
import { classifyReleaseType, RELEASE_RULES, validatePullRequest } from './release-policy.mjs';

const SEMANTIC_RELEASE_CONFIG = {
	preset: 'conventionalcommits',
	parserOpts: { noteKeywords: ['BREAKING CHANGE', 'BREAKING CHANGES'] },
	releaseRules: RELEASE_RULES,
};
const SILENT_LOGGER = { log() {} };

async function analyzeSyntheticCommit(message) {
	return analyzeCommits(SEMANTIC_RELEASE_CONFIG, {
		commits: [{ hash: 'synthetic', message }],
		cwd: process.cwd(),
		logger: SILENT_LOGGER,
	});
}

test('classifies every release-producing Conventional Commit type', () => {
	assert.equal(classifyReleaseType(['fix(rates): correct persistence']), 'patch');
	assert.equal(classifyReleaseType(['perf(chart): reduce render work']), 'patch');
	assert.equal(classifyReleaseType(['revert: restore previous rate calculation']), 'patch');
	assert.equal(classifyReleaseType(['feat(rates): add currency filtering']), 'minor');
	assert.equal(classifyReleaseType(['feat(api)!: replace rates endpoint']), 'major');
});

test('uses the highest semantic impact and recognizes breaking footers', () => {
	assert.equal(classifyReleaseType(['fix(rates): correct persistence', 'feat(rates): add filter']), 'minor');
	assert.equal(
		classifyReleaseType([
			'fix(rates): correct persistence',
			'refactor(api): remove old endpoint\n\nBREAKING CHANGE: legacy endpoint was removed',
		]),
		'major'
	);
});

test('does not release maintenance-only commits', () => {
	assert.equal(
		classifyReleaseType([
			'docs: update release guide',
			'test: add coverage',
			'chore: reorganize tooling',
			'refactor: extract mapper',
		]),
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
		['automation/deps/patch', 'chore(deps): apply safe patch updates'],
		['dependabot/npm_and_yarn/example-1.2.3', 'chore(deps): update example'],
		['renovate/example-1.x', 'chore(deps): update example'],
	];

	for (const [branch, title] of cases) assert.equal(validatePullRequest(branch, title), undefined, branch);
	assert.match(validatePullRequest('feature/new-dashboard', 'chore: reorganize tooling'), /expects a feat/);
	assert.match(validatePullRequest('unsupported/branch', 'chore: reorganize tooling'), /Unsupported branch name/);
});

test('uses semantic-release commit analysis to prove synthetic release outcomes', async () => {
	const cases = [
		['fix(rates): correct persistence', 'patch', 'v1.1.61'],
		['perf(chart): reduce render work', 'patch', 'v1.1.61'],
		['revert: restore previous rate calculation', 'patch', 'v1.1.61'],
		['feat(rates): add currency filtering', 'minor', 'v1.2.0'],
		['feat(api)!: replace rates endpoint', 'major', 'v2.0.0'],
		['docs: update release guide', null, null],
	];

	for (const [message, expectedType, expectedTag] of cases) {
		assert.equal(await analyzeSyntheticCommit(message), expectedType, message);
		assert.equal(
			expectedType ? { patch: 'v1.1.61', minor: 'v1.2.0', major: 'v2.0.0' }[expectedType] : null,
			expectedTag,
			message
		);
	}
});

test('uses the policy module in semantic-release configuration', () => {
	assert.deepEqual(releaseConfig.branches, ['master']);
	assert.equal(releaseConfig.tagFormat, 'v${version}');
	assert.deepEqual(
		releaseConfig.plugins.map(([plugin]) => plugin),
		['@semantic-release/commit-analyzer', '@semantic-release/release-notes-generator', '@semantic-release/github']
	);
});
