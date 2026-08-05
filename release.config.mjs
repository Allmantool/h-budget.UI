import { RELEASE_NOTE_TYPES, RELEASE_NOTE_WRITER_OPTIONS, RELEASE_RULES } from './tools/ci/release-policy.mjs';

const parserOpts = {
	noteKeywords: ['BREAKING CHANGE', 'BREAKING CHANGES'],
};

export default {
	branches: ['master'],
	tagFormat: 'v${version}',
	plugins: [
		[
			'@semantic-release/commit-analyzer',
			{ preset: 'conventionalcommits', parserOpts, releaseRules: RELEASE_RULES },
		],
		[
			'@semantic-release/release-notes-generator',
			{
				preset: 'conventionalcommits',
				parserOpts,
				presetConfig: { types: RELEASE_NOTE_TYPES },
				writerOpts: RELEASE_NOTE_WRITER_OPTIONS,
			},
		],
		[
			'@semantic-release/github',
			{
				releaseName: '${nextRelease.gitTag}',
				successCommentCondition: false,
				failComment: false,
				releasedLabels: false,
			},
		],
	],
};
