export const ECOSYSTEM_PACKAGES = [
	/^@angular($|\/)/,
	/^@angular-devkit($|\/)/,
	/^@angular-eslint($|\/)/,
	/^@nx($|\/)/,
	/^nx$/,
	/^@schematics\/angular$/,
	/^typescript$/,
	/^rxjs$/,
	/^zone\.js$/,
];

export const BUILD_CHAIN_PACKAGES = [
	/^@typescript-eslint($|\/)/,
	/^eslint($|-|\/)/,
	/^prettier$/,
	/^stylelint($|-|\/)/,
	/^karma($|-|\/)/,
	/^jasmine($|-|\/)/,
	/^@types\/jasmine$/,
	/^webpack($|-|\/)/,
	/^@angular-builders($|\/)/,
	/^@commitlint($|\/)/,
	/^semantic-release$/,
	/^@semantic-release($|\/)/,
];

export const MINOR_ALLOWLIST = new Set([
	'@types/lodash',
	'@types/uuid',
	'downsample',
	'flag-icons',
	'immer',
	'lodash',
	'material-design-icons',
	'ts-simple-nameof',
	'typescript-guid',
	'uuid',
]);

/**
 * Major updates require an explicit, deliberately small allowlist.  Framework
 * families are represented below and must use their dedicated migration path.
 */
export const MAJOR_ALLOWLIST = new Set(['@types/lodash', '@types/uuid']);

/**
 * A group is an atomic update unit. `manualMajor` makes generic major updates
 * fail closed while still documenting the packages that must migrate together.
 */
export const DEPENDENCY_GROUPS = [
	{
		name: 'angular',
		packages: [
			'@angular/animations',
			'@angular/cdk',
			'@angular/common',
			'@angular/compiler',
			'@angular/core',
			'@angular/forms',
			'@angular/material',
			'@angular/platform-browser',
			'@angular/platform-browser-dynamic',
			'@angular/router',
			'@angular/compiler-cli',
		],
		strategy: 'lockstep',
		manualMajor: true,
	},
	{
		name: 'nx',
		packages: ['nx', '@nx/angular', '@nx/eslint', '@nx/workspace'],
		strategy: 'lockstep',
		manualMajor: true,
	},
	{
		name: 'ngxs',
		packages: ['@ngxs/store', '@ngxs/logger-plugin', '@ngxs/devtools-plugin'],
		strategy: 'lockstep',
		manualMajor: true,
	},
];

export function isBlockedAutomaticPackage(packageName) {
	return [...ECOSYSTEM_PACKAGES, ...BUILD_CHAIN_PACKAGES].some(rule => rule.test(packageName));
}

export function isAllowedMinorPackage(packageName) {
	return MINOR_ALLOWLIST.has(packageName);
}

export function isAllowedMajorPackage(packageName) {
	return MAJOR_ALLOWLIST.has(packageName);
}

export function dependencyGroupFor(packageName, groups = DEPENDENCY_GROUPS) {
	return groups.find(group => group.packages.includes(packageName)) ?? null;
}
