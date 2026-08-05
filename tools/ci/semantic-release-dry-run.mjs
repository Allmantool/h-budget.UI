import semanticRelease from 'semantic-release';

import releaseConfig from '../../release.config.mjs';

const repositoryUrl = new URL('.git/', `file://${process.cwd().replaceAll('\\', '/')}/`).href;
const result = await semanticRelease(
	{
		...releaseConfig,
		plugins: releaseConfig.plugins.slice(0, 2),
		repositoryUrl,
		dryRun: true,
		noCi: true,
	},
	{
		cwd: process.cwd(),
		env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
	}
);

if (result === false) {
	console.log('Semantic-release dry run determined that no release is required.');
}
