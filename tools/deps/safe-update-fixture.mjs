import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawn, spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { basename, dirname, join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';

const sourceDepsDirectory = dirname(fileURLToPath(import.meta.url));
const npmCli = process.env.npm_execpath ?? join(dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npm-cli.js');

export async function createUpdaterFixture(testContext, options) {
	const directory = mkdtempSync(join(tmpdir(), 'safe-npm-updater-e2e-'));
	const registry = await startRegistry(options.packages);
	const updaterScript = copyUpdaterFiles(directory);
	writeFixtureManifest(directory, options);
	writeFileSync(join(directory, '.npmrc'), `registry=${registry.url}\nengine-strict=true\n`);
	await runNpm(directory, installArgs(), registry.url);
	initializeGit(directory);
	testContext.after(async () => {
		await registry.close();
		if (process.env.SAFE_NPM_PRESERVE_FIXTURES !== '1') removeFixture(directory);
	});
	return { directory, registry, options, updaterScript };
}

export function runUpdater(fixture, mode, extraEnvironment = {}) {
	return runProcess(process.execPath, [fixture.updaterScript, `--${mode}`], {
		cwd: fixture.directory,
		env: updaterEnvironment(fixture, extraEnvironment),
	});
}

export function startUpdater(fixture, mode, extraEnvironment = {}) {
	return spawn(process.execPath, [fixture.updaterScript, `--${mode}`], {
		cwd: fixture.directory,
		windowsHide: true,
		env: updaterEnvironment(fixture, extraEnvironment),
		stdio: ['ignore', 'pipe', 'pipe'],
	});
}

export function readState(fixture) {
	return JSON.parse(readFileSync(join(fixture.directory, '.dependency-upgrade', 'state.json'), 'utf8'));
}

export function fingerprintFiles(fixture) {
	return createHash('sha256')
		.update(readFileSync(join(fixture.directory, 'package.json')))
		.update(readFileSync(join(fixture.directory, 'package-lock.json')))
		.digest('hex');
}

export function runFixtureNpm(fixture, args) {
	return runNpm(fixture.directory, args, fixture.registry.url);
}

export function assertStateShape(state) {
	for (const field of [
		'schemaVersion',
		'runId',
		'mode',
		'status',
		'startedAt',
		'completedAt',
		'accepted',
		'rejected',
		'skipped',
		'discoveryFailures',
		'warnings',
		'validation',
	]) {
		assert.notEqual(state[field], undefined, `state is missing ${field}`);
	}
	assert.equal(state.schemaVersion, 1);
	assert.ok(Number.isFinite(Date.parse(state.startedAt)));
	assert.ok(Number.isFinite(Date.parse(state.completedAt)));
}

export function readManifest(fixture) {
	return JSON.parse(readFileSync(join(fixture.directory, 'package.json'), 'utf8'));
}

export function readLock(fixture) {
	return JSON.parse(readFileSync(join(fixture.directory, 'package-lock.json'), 'utf8'));
}

export function fixtureLogFiles(fixture) {
	const directory = join(fixture.directory, 'logs', 'dependency-upgrade');
	return existsSync(directory) ? requireFiles(directory) : [];
}

function writeFixtureManifest(directory, options) {
	const manifest = {
		name: 'safe-updater-e2e-fixture',
		version: '1.0.0',
		private: true,
		scripts: {
			'fixture:validate': options.validationScript ?? 'node -e "process.exit(0)"',
		},
		dependencies: options.dependencies,
	};
	writeFileSync(join(directory, 'package.json'), `${JSON.stringify(manifest, null, 2)}\n`);
}

function updaterEnvironment(fixture, extraEnvironment) {
	return {
		...process.env,
		SAFE_NPM_VALIDATION_SCRIPTS: 'fixture:validate',
		npm_config_registry: fixture.registry.url,
		...extraEnvironment,
	};
}

function copyUpdaterFiles(directory) {
	const targetDirectory = join(directory, 'tools', 'deps');
	mkdirSync(targetDirectory, { recursive: true });
	for (const file of ['common.mjs', 'rules.mjs', 'semver-policy.mjs', 'update-engine.mjs', 'safe-update.mjs']) {
		copyFileSync(join(sourceDepsDirectory, file), join(targetDirectory, file));
	}
	return join(targetDirectory, 'safe-update.mjs');
}

function installArgs() {
	return ['install', '--package-lock-only', '--ignore-scripts', '--strict-peer-deps', '--engine-strict', '--audit=false', '--fund=false'];
}

async function runNpm(cwd, args, registry) {
	const result = await runProcess(process.execPath, [npmCli, ...args], {
		cwd,
		env: { ...process.env, npm_config_registry: registry },
	});
	assert.equal(result.status, 0, `npm ${args.join(' ')} failed:\n${result.stdout}\n${result.stderr}`);
	return result;
}

function runProcess(command, args, options) {
	return new Promise((resolve, reject) => {
		const child = spawn(command, args, { ...options, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
		let stdout = '';
		let stderr = '';
		child.stdout.on('data', chunk => {
			stdout += chunk;
		});
		child.stderr.on('data', chunk => {
			stderr += chunk;
		});
		child.once('error', reject);
		child.once('exit', status => resolve({ status, stdout, stderr }));
	});
}

function initializeGit(directory) {
	for (const args of [
		['init', '--quiet'],
		['add', 'package.json', 'package-lock.json', '.npmrc'],
		['-c', 'user.name=Safe Updater Test', '-c', 'user.email=safe-updater@example.invalid', 'commit', '--quiet', '-m', 'baseline'],
	]) {
		const result = spawnSync('git', args, { cwd: directory, encoding: 'utf8' });
		assert.equal(result.status, 0, `git ${args.join(' ')} failed: ${result.stderr}`);
	}
}

async function startRegistry(packages) {
	const tarballs = new Map();
	for (const packageDefinition of packages) {
		for (const version of packageDefinition.versions) {
			tarballs.set(key(packageDefinition.name, version.version), createTarball(packageDefinition.name, version));
		}
	}
	const registry = { packages, tarballs, failureName: null };
	const server = createServer((request, response) => respond(registry, request.url ?? '/', response));
	await new Promise((resolve, reject) => {
		server.once('error', reject);
		server.listen(0, '127.0.0.1', resolve);
	});
	const address = server.address();
	assert.ok(address && typeof address === 'object');
	registry.url = `http://127.0.0.1:${address.port}/`;
	registry.close = () => new Promise(resolve => server.close(resolve));
	return registry;
}

function respond(registry, requestUrl, response) {
	const rawPathname = new URL(requestUrl, 'http://fixture.invalid').pathname;
	if (rawPathname.startsWith('/tarballs/')) {
		const [, , encodedName, versionFile] = rawPathname.split('/');
		const body = registry.tarballs.get(key(decodeURIComponent(encodedName), versionFile.replace(/\.tgz$/, '')));
		if (!body) return respondStatus(response, 404);
		response.writeHead(200, { 'content-type': 'application/octet-stream' });
		return response.end(body);
	}
	const found = findPackage(registry.packages, decodeURIComponent(rawPathname).slice(1));
	if (!found || registry.failureName === found.definition.name) return respondStatus(response, 503);
	const body = packageMetadata(registry, found.definition);
	response.writeHead(200, { 'content-type': 'application/json' });
	response.end(JSON.stringify(found.version ? body.versions[found.version] : body));
}

function findPackage(packages, requestPath) {
	for (const definition of packages) {
		if (requestPath === definition.name) return { definition, version: null };
		if (requestPath.startsWith(`${definition.name}/`))
			return { definition, version: requestPath.slice(definition.name.length + 1) };
	}
	return null;
}

function packageMetadata(registry, definition) {
	const versions = Object.fromEntries(
		definition.versions.map(version => {
			const tarball = registry.tarballs.get(key(definition.name, version.version));
			return [
				version.version,
				{
					name: definition.name,
					version: version.version,
					...(version.peerDependencies ? { peerDependencies: version.peerDependencies } : {}),
					...(version.engines ? { engines: version.engines } : {}),
					...(version.deprecated ? { deprecated: version.deprecated } : {}),
					dist: {
						tarball: `${registry.url}tarballs/${encodeURIComponent(definition.name)}/${version.version}.tgz`,
						shasum: createHash('sha1').update(tarball).digest('hex'),
					},
				},
			];
		})
	);
	return {
		name: definition.name,
		'dist-tags': { latest: definition.versions.at(-1).version },
		versions,
	};
}

function createTarball(name, version) {
	const manifest = Buffer.from(`${JSON.stringify({ name, version: version.version, peerDependencies: version.peerDependencies, engines: version.engines })}\n`);
	const source = Buffer.from(`module.exports = '${version.version}';\n`);
	return gzipSync(Buffer.concat([tarEntry('package/package.json', manifest), tarEntry('package/index.js', source), Buffer.alloc(1024)]));
}

function tarEntry(name, contents) {
	const header = Buffer.alloc(512);
	writeTarString(header, 0, 100, name);
	writeTarNumber(header, 100, 8, 0o644);
	writeTarNumber(header, 108, 8, 0);
	writeTarNumber(header, 116, 8, 0);
	writeTarNumber(header, 124, 12, contents.length);
	writeTarNumber(header, 136, 12, 0);
	header.fill(0x20, 148, 156);
	header[156] = '0'.charCodeAt(0);
	writeTarString(header, 257, 6, 'ustar');
	writeTarString(header, 263, 2, '00');
	writeTarString(header, 265, 32, 'root');
	writeTarString(header, 297, 32, 'root');
	writeTarNumber(header, 329, 8, 0);
	writeTarNumber(header, 337, 8, 0);
	writeTarNumber(header, 148, 8, header.reduce((sum, value) => sum + value, 0));
	const padding = Buffer.alloc((512 - (contents.length % 512)) % 512);
	return Buffer.concat([header, contents, padding]);
}

function writeTarString(buffer, offset, length, value) {
	buffer.write(value, offset, Math.min(Buffer.byteLength(value), length), 'utf8');
}

function writeTarNumber(buffer, offset, length, value) {
	buffer.write(value.toString(8).padStart(length - 1, '0'), offset, length - 1, 'ascii');
}

function key(name, version) {
	return `${name}@${version}`;
}

function respondStatus(response, status) {
	response.writeHead(status, { 'content-type': 'application/json' });
	response.end(JSON.stringify({ error: 'fixture registry failure' }));
}

function requireFiles(directory) {
	return readdirSync(directory).map(entry => join(directory, entry));
}

function removeFixture(directory) {
	assert.equal(basename(directory).startsWith('safe-npm-updater-e2e-'), true);
	rmSync(directory, { recursive: true, force: true, maxRetries: 3 });
}
