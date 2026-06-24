import { existsSync } from 'node:fs';
import { join } from 'node:path';
import {
	collectRootDependencies,
	ensureWorkDirs,
	getLockVersion,
	gitShowHead,
	parseVersion,
	readJson,
	repoRoot,
	runCommand,
} from './common.mjs';
import { isBlockedAutomaticPackage } from './rules.mjs';

const allowFrameworkUpdates = process.argv.includes('--allow-framework-updates');
const onlineRegistryCheck = process.argv.includes('--online-registry-check');

ensureWorkDirs();
const packageJson = readJson('package.json');
const packageLock = readJson('package-lock.json');
const failures = [];
const warnings = [];

validateLockfileRoot();
validateWebpackDevServerPolicy();
validateBlockedRootUpdates();
validateFrameworkVersionPolicy();
validateAngularNxAlignment();
validateNpmPeerGraph();
validateOnlineRegistryAvailability();

if (warnings.length > 0) {
	console.warn(warnings.map(warning => `warning: ${warning}`).join('\n'));
}

if (failures.length > 0) {
	console.error('Dependency guard failed:');
	for (const failure of failures) {
		console.error(`- ${failure}`);
	}
	process.exit(1);
}

console.log('Dependency guard passed.');

function validateLockfileRoot() {
	const rootLock = packageLock.packages?.[''];
	if (!rootLock) {
		failures.push('package-lock.json is missing the root package entry.');
		return;
	}

	for (const section of ['dependencies', 'devDependencies']) {
		const packageDeps = packageJson[section] ?? {};
		const lockDeps = rootLock[section] ?? {};

		for (const [name, spec] of Object.entries(packageDeps)) {
			if (lockDeps[name] !== spec) {
				failures.push(
					`package-lock.json root ${section}.${name} is ${lockDeps[name] ?? '<missing>'}, expected ${spec}.`
				);
			}
		}
	}
}

function validateWebpackDevServerPolicy() {
	const directWebpackPackages = ['webpack', 'webpack-cli', 'webpack-dev-server'].filter(
		name => packageJson.dependencies?.[name] !== undefined || packageJson.devDependencies?.[name] !== undefined
	);

	for (const name of directWebpackPackages) {
		failures.push(`${name} is declared directly; keep Webpack tooling owned by Angular/Nx builders unless a configured target requires it.`);
	}

	const overridePaths = findObjectPaths(packageJson.overrides, 'webpack-dev-server');
	for (const overridePath of overridePaths) {
		failures.push(`package.json override ${overridePath} forces webpack-dev-server; remove overrides unless the owner and range are proven.`);
	}

	const lockedVersion = getLockVersion(packageLock, 'webpack-dev-server');
	const requesters = findPackageRequesters('webpack-dev-server');

	if (!lockedVersion && requesters.length > 0) {
		failures.push('webpack-dev-server is requested by the lockfile but node_modules/webpack-dev-server is missing.');
		return;
	}

	if (!lockedVersion) {
		return;
	}

	if (requesters.length === 0) {
		failures.push(`webpack-dev-server@${lockedVersion} is locked but no package declares it.`);
		return;
	}

	for (const requester of requesters) {
		if (!versionSatisfies(lockedVersion, requester.spec)) {
			failures.push(
				`webpack-dev-server@${lockedVersion} does not satisfy ${requester.packageName}@${requester.version} ${requester.section}.${requester.dependencyName}=${requester.spec}.`
			);
		}
	}

	console.log(
		`webpack-dev-server@${lockedVersion} owner(s): ${requesters
			.map(requester => `${requester.packageName}@${requester.version} (${requester.section}.${requester.dependencyName}: ${requester.spec})`)
			.join('; ')}.`
	);
}

function validateBlockedRootUpdates() {
	if (allowFrameworkUpdates) {
		return;
	}

	const headPackageJson = gitShowHead('package.json');
	if (!headPackageJson) {
		warnings.push('Could not read HEAD:package.json; skipped blocked package diff guard.');
		return;
	}

	const before = collectRootDependencies(JSON.parse(headPackageJson));
	const after = collectRootDependencies(packageJson);

	const blockedChanges = [];

	for (const [name, nextSpec] of Object.entries(after)) {
		if (!isBlockedAutomaticPackage(name)) {
			continue;
		}

		const previousSpec = before[name];
		if (previousSpec !== undefined && previousSpec !== nextSpec) {
			blockedChanges.push({ name, previousSpec, nextSpec });
		}
	}

	if (blockedChanges.length === 0) {
		return;
	}

	if (isApprovedAngular21Migration()) {
		warnings.push(
			'Approved Angular 21 migration package set detected; framework diff guard allowed this exact staged update.'
		);
		return;
	}

	for (const { name, previousSpec, nextSpec } of blockedChanges) {
		failures.push(
			`${name} changed from ${previousSpec} to ${nextSpec}; framework/build-chain packages require manual nx migrate or an explicit allow flag.`
		);
	}
}

function validateFrameworkVersionPolicy() {
	const disallowedPackages = Object.entries(packageLock.packages ?? {})
		.filter(([packagePath, details]) => isDisallowedFrameworkVersion(packagePath, details?.version))
		.map(([packagePath, details]) => `${packagePath.replace(/^node_modules\//, '')}@${details.version}`);

	if (disallowedPackages.length > 0) {
		failures.push(`Disallowed framework versions found: ${disallowedPackages.join(', ')}.`);
	}

	const typescriptVersion = getLockVersion(packageLock, 'typescript');
	const parsedTypeScript = parseVersion(typescriptVersion);
	if (!parsedTypeScript || parsedTypeScript.major >= 6) {
		failures.push(`TypeScript must remain on supported 5.9.x; found ${typescriptVersion ?? '<missing>'}.`);
	}
}

function validateAngularNxAlignment() {
	const angularPackages = [
		'@angular/animations',
		'@angular/common',
		'@angular/compiler',
		'@angular/compiler-cli',
		'@angular/core',
		'@angular/forms',
		'@angular/platform-browser',
		'@angular/platform-browser-dynamic',
		'@angular/router',
	];
	const angularMajors = versionsFor(angularPackages)
		.map(({ name, version }) => ({ name, parsed: parseVersion(version), version }))
		.filter(({ parsed }) => parsed);

	const distinctAngularMajors = new Set(angularMajors.map(({ parsed }) => parsed.major));
	if (distinctAngularMajors.size > 1) {
		failures.push(
			`Angular packages have mixed major versions: ${angularMajors
				.map(({ name, version }) => `${name}@${version}`)
				.join(', ')}.`
		);
	}

	if ([...distinctAngularMajors].some(major => major > 21)) {
		failures.push(
			`Angular packages must not advance beyond major 21 in this repository: ${angularMajors
				.map(({ name, version }) => `${name}@${version}`)
				.join(', ')}.`
		);
	}

	const nxPackages = ['nx', '@nx/angular', '@nx/eslint', '@nx/workspace'];
	const nxMajors = versionsFor(nxPackages)
		.map(({ name, version }) => ({ name, parsed: parseVersion(version), version }))
		.filter(({ parsed }) => parsed);

	const distinctNxMajors = new Set(nxMajors.map(({ parsed }) => parsed.major));
	if (distinctNxMajors.size > 1) {
		failures.push(
			`Nx packages have mixed major versions: ${nxMajors
				.map(({ name, version }) => `${name}@${version}`)
				.join(', ')}.`
		);
	}

	const distinctNxVersions = new Set(nxMajors.map(({ version }) => version));
	if (distinctNxVersions.size > 1) {
		failures.push(
			`Nx packages must use one exact version: ${nxMajors
				.map(({ name, version }) => `${name}@${version}`)
				.join(', ')}.`
		);
	}

	const ngxsPackages = ['@ngxs/store', '@ngxs/logger-plugin', '@ngxs/devtools-plugin'];
	const ngxsVersions = versionsFor(ngxsPackages)
		.map(({ name, version }) => ({ name, parsed: parseVersion(version), version }))
		.filter(({ parsed }) => parsed);

	const invalidNgxsVersions = ngxsVersions.filter(({ parsed }) => parsed.major !== 21);
	if (invalidNgxsVersions.length > 0) {
		failures.push(
			`NGXS packages must remain on compatible major 21 versions: ${ngxsVersions
				.map(({ name, version }) => `${name}@${version}`)
				.join(', ')}.`
		);
	}
}

function validateNpmPeerGraph() {
	if (!existsSync(join(repoRoot, 'node_modules'))) {
		warnings.push('node_modules is missing; npm peer graph validation will run after npm ci.');
		return;
	}

	const result = runCommand('npm', ['ls', '--depth=0'], { stdio: 'pipe' });
	if (result.status === 0) {
		return;
	}

	const output = `${result.stdout ?? ''}\n${result.stderr ?? ''}`;
	const importantLines = output
		.split(/\r?\n/)
		.filter(line => /ERESOLVE|invalid|peer dep|peerDependency|missing/i.test(line))
		.slice(0, 30);

	failures.push(
		importantLines.length > 0
			? `npm root dependency graph has peer/invalid package problems:\n${importantLines.join('\n')}`
			: 'npm root dependency graph is invalid. Run npm ls --depth=0 for details.'
	);
}

function validateOnlineRegistryAvailability() {
	if (!onlineRegistryCheck) {
		return;
	}

	const lockedVersion = getLockVersion(packageLock, 'webpack-dev-server');
	if (!lockedVersion) {
		return;
	}

	const result = runCommand('npm', ['view', `webpack-dev-server@${lockedVersion}`, 'version'], { stdio: 'pipe' });
	const publishedVersion = result.stdout?.trim();
	if (result.status !== 0 || publishedVersion !== lockedVersion) {
		failures.push(
			`Configured npm registry does not resolve webpack-dev-server@${lockedVersion}. Run npm view webpack-dev-server@${lockedVersion} version to inspect registry/cache routing.`
		);
	}
}

function versionsFor(packageNames) {
	return packageNames
		.map(name => ({ name, version: getLockVersion(packageLock, name) }))
		.filter(({ version }) => version);
}

function findPackageRequesters(dependencyName) {
	return Object.entries(packageLock.packages ?? [])
		.flatMap(([packagePath, details]) => {
			const sections = ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies'];
			return sections
				.filter(section => details?.[section]?.[dependencyName] !== undefined)
				.map(section => ({
					packagePath,
					packageName: packagePath === '' ? packageJson.name : packagePath.replace(/^node_modules\//, ''),
					version: packagePath === '' ? packageJson.version : details.version,
					section,
					dependencyName,
					spec: details[section][dependencyName],
				}));
		});
}

function findObjectPaths(value, targetKey, path = 'overrides') {
	if (!value || typeof value !== 'object') {
		return [];
	}

	return Object.entries(value).flatMap(([key, nestedValue]) => {
		const currentPath = `${path}.${key}`;
		const matches = key === targetKey ? [currentPath] : [];
		return [...matches, ...findObjectPaths(nestedValue, targetKey, currentPath)];
	});
}

function versionSatisfies(version, spec) {
	if (!spec || spec === '*') {
		return true;
	}

	const parsedVersion = parseVersion(version);
	if (!parsedVersion) {
		return false;
	}

	if (/^\d+\.\d+\.\d+$/.test(spec)) {
		return version === spec;
	}

	if (spec.startsWith('^')) {
		const minimum = parseVersion(spec.slice(1));
		return (
			!!minimum &&
			parsedVersion.major === minimum.major &&
			compareVersionParts(parsedVersion, minimum) >= 0
		);
	}

	return true;
}

function compareVersionParts(left, right) {
	for (const key of ['major', 'minor', 'patch']) {
		if (left[key] !== right[key]) {
			return left[key] - right[key];
		}
	}

	return 0;
}

function isApprovedAngular21Migration() {
	const requiredSpecs = {
		'@angular/animations': '21.2.16',
		'@angular/cdk': '21.2.14',
		'@angular/common': '21.2.16',
		'@angular/compiler': '21.2.16',
		'@angular/core': '21.2.16',
		'@angular/forms': '21.2.16',
		'@angular/material': '21.2.14',
		'@angular/platform-browser': '21.2.16',
		'@angular/platform-browser-dynamic': '21.2.16',
		'@angular/router': '21.2.16',
		'zone.js': '0.16.2',
		'@ngxs/devtools-plugin': '21.0.0',
		'@ngxs/logger-plugin': '21.0.0',
		'@ngxs/store': '21.0.0',
		'@angular-devkit/build-angular': '21.2.16',
		'@angular-devkit/core': '21.2.16',
		'@angular-eslint/builder': '21.0.1',
		'@angular-eslint/eslint-plugin': '21.0.1',
		'@angular-eslint/eslint-plugin-template': '21.0.1',
		'@angular-eslint/schematics': '21.0.1',
		'@angular-eslint/template-parser': '21.0.1',
		'@angular/cli': '21.2.16',
		'@angular/compiler-cli': '21.2.16',
		'@nx/angular': '22.7.5',
		'@nx/eslint': '22.7.5',
		'@nx/workspace': '22.7.5',
		'@schematics/angular': '21.2.16',
		nx: '22.7.5',
	};

	const dependencies = collectRootDependencies(packageJson);
	return Object.entries(requiredSpecs).every(([name, version]) => dependencies[name] === version);
}

function isDisallowedFrameworkVersion(packagePath, version) {
	if (!version) {
		return false;
	}

	const packageName = packagePath.replace(/^node_modules\//, '');

	if (
		packageName !== 'typescript' &&
		!packageName.startsWith('@angular/') &&
		!packageName.startsWith('@angular-devkit/') &&
		!packageName.startsWith('@angular-eslint/') &&
		packageName !== '@schematics/angular'
	) {
		return false;
	}

	const parsed = parseVersion(version);
	if (!parsed) {
		return true;
	}

	if (packageName === 'typescript') {
		return parsed.major >= 6;
	}

	if (
		packageName.startsWith('@angular/') ||
		packageName.startsWith('@angular-devkit/') ||
		packageName === '@schematics/angular'
	) {
		return parsed.major > 21;
	}

	if (packageName.startsWith('@angular-eslint/')) {
		return parsed.major > 21;
	}

	return false;
}
