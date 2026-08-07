import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

const readWorkflow = workflow => readFile(new URL(`../../.github/workflows/${workflow}`, import.meta.url), 'utf8');

describe('release workflow compatibility contracts', () => {
	it('preserves the previous CI targets and root dependency graph check', async () => {
		const workflow = await readWorkflow('build.yml');

		assert.match(
			workflow,
			/branches: \[master, developed, feature\/\*, test\/\*, hotfix\/\*, fix\/\*, tech\/\*\*\]/
		);
		assert.match(workflow, /name: Validate root dependency graph\s+run: npm ls --depth=0/);
	});

	it('keeps mandatory pull-request quality gates enabled without optional outcomes', async () => {
		const [ciWorkflow, policyWorkflow, codeqlWorkflow] = await Promise.all([
			readWorkflow('build.yml'),
			readWorkflow('pr-release-policy.yml'),
			readWorkflow('codeql-analysis.yml'),
		]);

		assert.match(ciWorkflow, /on:\s+pull_request:/);
		assert.match(ciWorkflow, /run: npm ci --strict-peer-deps --engine-strict/);
		assert.match(ciWorkflow, /run: npm run deps:guard/);
		assert.match(ciWorkflow, /run: npm run lint/);
		assert.match(ciWorkflow, /run: npm run test:ci/);
		assert.match(ciWorkflow, /run: npm run build:prod/);
		assert.match(policyWorkflow, /on:\s+pull_request:\s+branches: \[master\]/);
		assert.match(policyWorkflow, /run: node tools\/ci\/release-policy\.mjs/);
		assert.match(codeqlWorkflow, /push:\s+branches: \[master\]/);
		assert.match(
			codeqlWorkflow,
			/pull_request:\s+# The branches below must be a subset of the branches above\s+branches: \[master\]/
		);
		assert.match(codeqlWorkflow, /github\/codeql-action\/init@v3/);
		assert.match(codeqlWorkflow, /github\/codeql-action\/analyze@v3/);
		assert.match(codeqlWorkflow, /security-events: write/);

		for (const workflow of [ciWorkflow, policyWorkflow, codeqlWorkflow]) {
			assert.doesNotMatch(workflow, /continue-on-error:/);
		}
	});

	it('uses GitHub App authentication for dependency-update PRs and preserves their quality gates', async () => {
		const [dependencyWorkflow, ciWorkflow, policyWorkflow, codeqlWorkflow] = await Promise.all([
			readWorkflow('update_npm_packages.yml'),
			readWorkflow('build.yml'),
			readWorkflow('pr-release-policy.yml'),
			readWorkflow('codeql-analysis.yml'),
		]);

		assert.match(dependencyWorkflow, /workflow_dispatch:\s+inputs:\s+mode:/);
		assert.match(dependencyWorkflow, /schedule:\s+- cron: '17 3 \* \* 1,3,5'/);
		assert.match(dependencyWorkflow, /BRANCH_PREFIX: automation\/deps/);
		assert.match(
			dependencyWorkflow,
			/name: Validate dependency updater GitHub App configuration\s+shell: bash\s+env:\s+APP_ID: \$\{\{ secrets\.DEPENDENCY_UPDATER_APP_ID \}\}\s+PRIVATE_KEY: \$\{\{ secrets\.DEPENDENCY_UPDATER_APP_PRIVATE_KEY \}\}\s+run: \|\s+if \[\[ -z "\$APP_ID" \|\| -z "\$PRIVATE_KEY" \]\]; then\s+echo 'Dependency updater GitHub App configuration is unavailable\.' >&2/
		);
		assert.match(
			dependencyWorkflow,
			/name: Create dependency-updater GitHub App token\s+id: app-token\s+uses: actions\/create-github-app-token@v2\s+with:\s+app-id: \$\{\{ secrets\.DEPENDENCY_UPDATER_APP_ID \}\}\s+private-key: \$\{\{ secrets\.DEPENDENCY_UPDATER_APP_PRIVATE_KEY \}\}/
		);
		assert.ok(
			dependencyWorkflow.indexOf('name: Validate dependency updater GitHub App configuration') <
				dependencyWorkflow.indexOf('name: Create dependency-updater GitHub App token'),
			'Configuration validation must run before GitHub App token creation.'
		);
		assert.match(dependencyWorkflow, /token: \$\{\{ steps\.app-token\.outputs\.token \}\}/);
		assert.match(dependencyWorkflow, /GH_TOKEN: \$\{\{ steps\.app-token\.outputs\.token \}\}/);
		assert.match(dependencyWorkflow, /gh pr create --base/);
		assert.match(dependencyWorkflow, /chore\(deps\): apply safe \$MODE dependency updates/);
		assert.doesNotMatch(dependencyWorkflow, /(?:secrets\.GITHUB_TOKEN|github\.token|GH_PAT|PERSONAL_ACCESS_TOKEN)/);
		assert.doesNotMatch(dependencyWorkflow, /(?:gh pr merge|auto-merge)/);

		assert.match(ciWorkflow, /on:\s+pull_request:\s+branches: \[master,/);
		assert.match(policyWorkflow, /on:\s+pull_request:\s+branches: \[master\]/);
		assert.match(
			codeqlWorkflow,
			/pull_request:\s+# The branches below must be a subset of the branches above\s+branches: \[master\]/
		);
	});

	it('runs Sonar with the existing secret and generated coverage before release publication', async () => {
		const workflow = await readWorkflow('merge-pr.yml');
		const sonarStep = workflow.indexOf('name: Run SonarQube analysis');
		const publishStep = workflow.indexOf('name: Publish GitHub Release and immutable tag');

		assert.ok(sonarStep >= 0, 'The master release workflow must include Sonar analysis.');
		assert.ok(publishStep > sonarStep, 'Sonar analysis must complete before semantic-release can publish.');
		assert.match(workflow, /SONAR_TOKEN: \$\{\{ secrets\.SONAR_TOKEN \}\}/);
		assert.match(workflow, /npm run sonar -Dsonar\.login="\$SONAR_TOKEN"/);
		assert.ok(workflow.indexOf('name: Test') < sonarStep, 'Karma must produce coverage before Sonar runs.');
	});

	it('releases every master push from its triggering revision with complete Git history', async () => {
		const workflow = await readWorkflow('merge-pr.yml');

		assert.match(workflow, /on:\s+push:\s+branches: \[master\]/);
		assert.match(
			workflow,
			/name: Check out master with tags\s+uses: actions\/checkout@v6\s+with:\s+ref: \$\{\{ github\.sha \}\}\s+fetch-depth: 0/
		);
		assert.match(workflow, /name: Verify triggering master revision/);
		assert.match(workflow, /TRIGGERING_REF: \$\{\{ github\.ref \}\}/);
		assert.match(workflow, /TRIGGERING_SHA: \$\{\{ github\.sha \}\}/);
		assert.match(workflow, /git rev-parse HEAD/);
		assert.match(workflow, /\$head_sha" != "\$TRIGGERING_SHA/);
		assert.match(workflow, /git rev-parse origin\/master/);
		assert.match(workflow, /git describe --tags --always/);
		assert.match(workflow, /git log -5 --oneline --decorate/);
	});

	it('retains a manual redeploy path limited to an explicit immutable release tag', async () => {
		const workflow = await readWorkflow('github-deployment.yml');

		assert.match(workflow, /workflow_dispatch:/);
		assert.match(workflow, /description: Existing immutable vMAJOR\.MINOR\.PATCH tag to rebuild and deploy\./);
		assert.match(
			workflow,
			/run-name: \$\{\{ inputs\.redeploy && 'Redeploy' \|\| 'Deploy' \}\} \$\{\{ inputs\.release_tag \}\}/
		);
		assert.match(workflow, /default: true\s+required: false\s+type: boolean/);
		assert.match(workflow, /ref: \$\{\{ inputs\.release_tag \}\}/);
		assert.match(workflow, /\^v\[0-9\]\+\\\.\[0-9\]\+\\\.\[0-9\]\+\$/);
		assert.match(workflow, /git show-ref --verify --quiet "refs\/tags\/\$RELEASE_TAG"/);
		assert.match(workflow, /git rev-parse "refs\/tags\/\$RELEASE_TAG\^\{commit\}"/);
		assert.match(workflow, /\$EXPECTED_RELEASE_SHA" != "\$release_sha/);
	});

	it('dispatches deployment only for a semantic-release tag and publishes release observability data', async () => {
		const workflow = await readWorkflow('merge-pr.yml');

		assert.match(workflow, /actions: write/);
		assert.match(
			workflow,
			/outputs:\s+release_tag: \$\{\{ steps\.publish\.outputs\.release_tag \}\}\s+release_sha: \$\{\{ steps\.publish\.outputs\.release_sha \}\}/
		);
		assert.match(workflow, /release_tag=\$release_tag/);
		assert.match(workflow, /release_sha=\$release_sha/);
		assert.match(workflow, /if: steps\.publish\.outputs\.release_tag != ''/);
		assert.match(
			workflow,
			/previous_tag="\$\(git tag --merged HEAD --list 'v\*' --sort=-version:refname \| head -n 1\)"/
		);
		assert.ok(
			workflow.indexOf('npx --no-install semantic-release') >
				workflow.indexOf('previous_tag="$(git tag --merged HEAD'),
			'Semantic-release must analyze commits after the last stable tag reachable from the checked-out revision.'
		);
		assert.match(workflow, /release_sha="\$\(git rev-parse "refs\/tags\/\$release_tag\^\{commit\}"\)"/);
		assert.match(workflow, /\$release_sha" != "\$\(git rev-parse HEAD\)/);
		assert.match(workflow, /gh workflow run github-deployment\.yml --ref master/);
		assert.match(workflow, /--field release_tag="\$RELEASE_TAG" --field release_sha="\$RELEASE_SHA"/);
		assert.match(workflow, /# 🚀 Release \$RELEASE_TAG/);
		assert.match(workflow, /# No Release Required/);
		assert.match(workflow, /View GitHub Release/);
	});

	it('makes the exact deployment result traceable without a PAT or duplicate release trigger', async () => {
		const [releaseWorkflow, deploymentWorkflow] = await Promise.all([
			readWorkflow('merge-pr.yml'),
			readWorkflow('github-deployment.yml'),
		]);

		assert.match(deploymentWorkflow, /name: Write deployment summary/);
		assert.match(deploymentWorkflow, /\| Tag \|/);
		assert.match(deploymentWorkflow, /\| Commit \|/);
		assert.match(deploymentWorkflow, /\$IMAGE_NAME:\$\{VERSION:-unavailable\}/);
		assert.doesNotMatch(releaseWorkflow, /PAT/);
		assert.doesNotMatch(deploymentWorkflow, /^\s*(push|release|workflow_run|repository_dispatch):/m);
		assert.doesNotMatch(deploymentWorkflow, /semantic-release/);
	});
});
