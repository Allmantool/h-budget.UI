import { closeSync, copyFileSync, existsSync, mkdirSync, openSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { collectRootDependencies, getLockVersion, logsDir, repoRoot, runCommand, workDir } from './common.mjs';
import { DEPENDENCY_GROUPS } from './rules.mjs';
import { selectCandidate } from './semver-policy.mjs';
import { createUpdateEngine } from './update-engine.mjs';

const mode = parseMode(process.argv.slice(2));
const startedAt = new Date().toISOString();
const runId = `${startedAt.replace(/[:.]/g, '-')}-${process.pid}`;
const runDir = join(workDir, `run-${runId}`);
const stateFile = join(workDir, 'state.json');
const lockFile = join(workDir, 'dependency-update.lock');
const manifestFile = join(repoRoot, 'package.json');
const lockfileFile = join(repoRoot, 'package-lock.json');
let lockHandle;
let ownsLock = false;
let baseline;

try {
	mkdirSync(runDir, { recursive: true });
	mkdirSync(logsDir, { recursive: true });
	acquireLock();
	verifyPrerequisites();
	verifyWorkingTree();
	baseline = snapshot();
	copyFileSync(manifestFile, join(runDir, 'package.baseline.json'));
	copyFileSync(lockfileFile, join(runDir, 'package-lock.baseline.json'));
	installInterruptionHandlers();
	const discovery = discoverCandidates();
	if (discovery.failures.length)
		finish(2, state('failed', { discoveryFailures: discovery.failures, skipped: discovery.skipped }));
	if (!discovery.candidates.length)
		finish(
			0,
			state('no-updates', { accepted: [], rejected: [], skipped: discovery.skipped, discoveryFailures: [] })
		);
	const result = createUpdateEngine(createActions()).run(discovery.candidates);
	const exitCode = result.status === 'failed' || result.status === 'rolled-back' ? 1 : 0;
	finish(exitCode, state(result.status, { ...result, skipped: discovery.skipped, discoveryFailures: [] }));
} catch (error) {
	if (isLockContention(error)) {
		writeJson(
			join(workDir, `lock-contention-${runId}.json`),
			state('lock-contention', {
				error: message(error),
				lockContention: true,
			})
		);
		process.exitCode = 3;
	} else {
		const restored = baseline ? restore(baseline) : false;
		finish(
			1,
			state('failed', {
				accepted: [],
				rejected: [],
				skipped: [],
				discoveryFailures: [],
				error: message(error),
				rollback: restored,
			})
		);
	}
} finally {
	releaseLock();
}

function discoverCandidates() {
	const manifest = readJson(manifestFile);
	const lock = readJson(lockfileFile);
	const candidates = [];
	const skipped = [];
	const failures = [];
	for (const [name, spec] of Object.entries(collectRootDependencies(manifest)).sort(([a], [b]) =>
		a.localeCompare(b)
	)) {
		const section = sectionFor(manifest, name);
		if (!section) {
			failures.push({ name, reason: 'dependency is declared in conflicting sections' });
			continue;
		}
		const published = registryVersions(name);
		if (!published.ok) {
			failures.push({ name, reason: published.reason, registryMetadataStatus: 'failed' });
			continue;
		}
		const metadataByVersion = Object.fromEntries(
			published.versions.map(version => [version, registryMetadata(name, version)])
		);
		const metadataFailure = Object.entries(metadataByVersion).find(
			([, metadata]) => metadata.metadataStatus !== 'ok'
		);
		if (metadataFailure) {
			failures.push({
				name,
				reason: `registry metadata failed for ${metadataFailure[0]}`,
				registryMetadataStatus: metadataFailure[1].metadataStatus,
			});
			continue;
		}
		const selected = selectCandidate({
			name,
			section,
			spec,
			currentVersion: getLockVersion(lock, name),
			versions: published.versions,
			mode,
			groups: DEPENDENCY_GROUPS,
			metadataByVersion,
		});
		if (selected.kind === 'candidate') candidates.push(selected);
		else skipped.push(selected);
	}
	return { candidates, skipped, failures };
}

function createActions() {
	return {
		snapshot,
		restore,
		apply(candidates) {
			const manifest = readJson(manifestFile);
			for (const candidate of candidates) manifest[candidate.section][candidate.name] = candidate.to;
			writeJson(manifestFile, manifest);
		},
		resolve(label) {
			return runNpm(
				label,
				[
					'install',
					'--package-lock-only',
					'--ignore-scripts',
					'--strict-peer-deps',
					'--engine-strict',
					'--audit=false',
					'--fund=false',
				],
				'dependency-resolution'
			);
		},
		verifyLock(candidates) {
			const lock = readJson(lockfileFile);
			const mismatch = candidates.find(candidate => getLockVersion(lock, candidate.name) !== candidate.toVersion);
			return mismatch
				? {
						ok: false,
						stage: 'lockfile-verification',
						reason: `${mismatch.name} expected ${mismatch.toVersion}, lockfile contains ${getLockVersion(lock, mismatch.name) ?? '<missing>'}`,
					}
				: { ok: true, stage: 'lockfile-verification' };
		},
		validate(label) {
			const before = fingerprint();
			const clean = runNpm(
				label,
				['ci', '--strict-peer-deps', '--engine-strict', '--audit=false', '--fund=false'],
				'clean-install'
			);
			if (!clean.ok) return clean;
			if (before !== fingerprint())
				return { ok: false, stage: 'clean-install', reason: 'npm ci rewrote a dependency manifest' };
			const graph = runNpm(label, ['ls', '--depth=0'], 'dependency-graph-validation');
			if (!graph.ok) return graph;
			for (const script of validationScripts(readJson(manifestFile))) {
				const result = runNpm(label, ['run', script], `repository-validation:${script}`);
				if (!result.ok) return result;
			}
			const changedFiles = trackedChangedFiles().filter(
				file => file !== 'package.json' && file !== 'package-lock.json'
			);
			if (changedFiles.length)
				return {
					ok: false,
					stage: 'repository-mutation-detection',
					reason: `validation modified tracked files: ${changedFiles.join(', ')}`,
				};
			return { ok: true, stage: 'complete' };
		},
	};
}

function registryVersions(name) {
	const result = runCommand('npm', ['view', name, 'versions', '--json'], {
		stdio: 'pipe',
		logFile: logFile(`registry-${safeName(name)}`),
	});
	if (result.status !== 0) return { ok: false, reason: `registry query failed (${result.status ?? 'unknown'})` };
	try {
		const value = JSON.parse(String(result.stdout));
		const versions = Array.isArray(value) ? value : [value];
		return versions.length && versions.every(version => typeof version === 'string')
			? { ok: true, versions }
			: { ok: false, reason: 'registry metadata was invalid' };
	} catch {
		return { ok: false, reason: 'registry metadata was unparseable' };
	}
}

function registryMetadata(name, version) {
	const result = runCommand(
		'npm',
		['view', `${name}@${version}`, 'deprecated', 'engines', 'peerDependencies', '--json'],
		{ stdio: 'pipe', logFile: logFile(`metadata-${safeName(name)}-${version}`) }
	);
	if (result.status !== 0) return { deprecated: true, metadataStatus: 'failed' };
	try {
		const value = JSON.parse(String(result.stdout) || '{}');
		return {
			deprecated: Boolean(value.deprecated),
			engines: value.engines ?? null,
			peerDependencies: value.peerDependencies ?? null,
			metadataStatus: 'ok',
		};
	} catch {
		return { deprecated: true, metadataStatus: 'invalid' };
	}
}

function runNpm(label, args, stage) {
	const result = runCommand('npm', args, {
		stdio: 'inherit',
		logFile: logFile(`${label}-${stage}`),
		env: { ...process.env, SAFE_NPM_UPDATE_LABEL: label },
	});
	return result.status === 0
		? { ok: true, stage }
		: { ok: false, stage, reason: `npm ${args[0]} failed with exit code ${result.status ?? 'unknown'}` };
}

function validationScripts(manifest) {
	const scripts = manifest.scripts ?? {};
	const configured = process.env.SAFE_NPM_VALIDATION_SCRIPTS?.split(',')
		.map(value => value.trim())
		.filter(Boolean);
	const required = configured?.length
		? configured
		: ['deps:guard', 'lint', 'test:ci', 'build:prod', 'deps:verify:framework'];
	const missing = required.filter(name => typeof scripts[name] !== 'string');
	if (missing.length) throw new Error(`required validation scripts are missing: ${missing.join(', ')}`);
	return required;
}

function snapshot() {
	return {
		packageJson: readFileSync(manifestFile),
		packageLock: readFileSync(lockfileFile),
		fingerprint: fingerprint(),
	};
}
function restore(value) {
	try {
		writeFileSync(manifestFile, value.packageJson);
		writeFileSync(lockfileFile, value.packageLock);
		return fingerprint() === value.fingerprint;
	} catch {
		return false;
	}
}
function fingerprint() {
	return createHash('sha256').update(readFileSync(manifestFile)).update(readFileSync(lockfileFile)).digest('hex');
}
function verifyPrerequisites() {
	if (!existsSync(manifestFile) || !existsSync(lockfileFile))
		throw new Error('package.json and package-lock.json are required');
	readJson(manifestFile);
	readJson(lockfileFile);
}
function verifyWorkingTree() {
	if (trackedChangedFiles().length && process.env.SAFE_NPM_ALLOW_DIRTY !== '1')
		throw new Error(
			'tracked working-tree changes detected; set SAFE_NPM_ALLOW_DIRTY=1 only after protecting unrelated work'
		);
}
function trackedChangedFiles() {
	const result = runCommand('git', ['diff', '--name-only'], { stdio: 'pipe' });
	if (result.status !== 0) throw new Error('unable to inspect working tree');
	return String(result.stdout).split(/\r?\n/).filter(Boolean);
}
function sectionFor(manifest, name) {
	const inDependencies = manifest.dependencies?.[name] !== undefined;
	const inDevDependencies = manifest.devDependencies?.[name] !== undefined;
	return inDependencies === inDevDependencies ? null : inDependencies ? 'dependencies' : 'devDependencies';
}
function readJson(file) {
	return JSON.parse(readFileSync(file, 'utf8'));
}
function writeJson(file, value) {
	writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}
function parseMode(args) {
	const modes = args.filter(arg => ['--patch', '--minor', '--major'].includes(arg)).map(arg => arg.slice(2));
	const modeIndex = args.indexOf('--mode');
	if (modeIndex >= 0) modes.push(args[modeIndex + 1]);
	if (modes.length !== 1 || !['patch', 'minor', 'major'].includes(modes[0]))
		throw new Error('select exactly one mode: --mode patch|minor|major');
	return modes[0];
}
function acquireLock() {
	try {
		lockHandle = openSync(lockFile, 'wx');
		ownsLock = true;
		writeFileSync(lockHandle, JSON.stringify({ pid: process.pid, runId, startedAt: new Date().toISOString() }));
	} catch (error) {
		if (error?.code === 'EEXIST') {
			const contention = new Error(`another updater owns ${lockFile}`);
			contention.code = 'ELOCKED';
			throw contention;
		}
		throw error;
	}
}
function releaseLock() {
	if (lockHandle !== undefined) {
		closeSync(lockHandle);
		lockHandle = undefined;
	}
	if (!ownsLock) return;
	ownsLock = false;
	try {
		rmSync(lockFile);
	} catch {}
}
function installInterruptionHandlers() {
	for (const signal of ['SIGINT', 'SIGTERM'])
		process.once(signal, () => {
			if (baseline) restore(baseline);
			releaseLock();
			process.exit(signal === 'SIGINT' ? 130 : 143);
		});
}
function state(status, extra) {
	return {
		schemaVersion: 1,
		runId,
		mode,
		status,
		startedAt,
		completedAt: new Date().toISOString(),
		accepted: [],
		rejected: [],
		skipped: [],
		discoveryFailures: [],
		warnings: [],
		validation: {},
		...extra,
	};
}
function finish(code, payload) {
	writeJson(stateFile, payload);
	releaseLock();
	process.exit(code);
}
function safeName(value) {
	return value.replace(/[^a-z0-9.-]+/gi, '_');
}
function logFile(label) {
	return join(logsDir, `${runId}-${safeName(label)}.log`);
}
function message(error) {
	return error instanceof Error ? error.message : String(error);
}
function isLockContention(error) {
	return error && typeof error === 'object' && error.code === 'ELOCKED';
}
