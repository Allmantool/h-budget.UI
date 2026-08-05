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

	it('retains a manual redeploy path limited to an explicit immutable release tag', async () => {
		const workflow = await readWorkflow('github-deployment.yml');

		assert.match(workflow, /workflow_dispatch:/);
		assert.match(workflow, /description: Existing immutable vMAJOR\.MINOR\.PATCH tag to rebuild and deploy\./);
		assert.match(workflow, /ref: \$\{\{ inputs\.release_tag \}\}/);
		assert.match(workflow, /\^v\[0-9\]\+\\\.\[0-9\]\+\\\.\[0-9\]\+\$/);
		assert.match(workflow, /git show-ref --verify --quiet "refs\/tags\/\$RELEASE_TAG"/);
		assert.match(workflow, /git rev-parse "refs\/tags\/\$RELEASE_TAG\^\{commit\}"/);
	});
});
