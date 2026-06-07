import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

export const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const workDir = join(repoRoot, '.dependency-upgrade');
export const logsDir = join(repoRoot, 'logs', 'dependency-upgrade');

export function ensureWorkDirs() {
  mkdirSync(workDir, { recursive: true });
  mkdirSync(logsDir, { recursive: true });
}

export function readJson(relativePath) {
  return JSON.parse(readFileSync(join(repoRoot, relativePath), 'utf8'));
}

export function writeJson(relativePath, value) {
  writeFileSync(join(repoRoot, relativePath), `${JSON.stringify(value, null, 2)}\n`);
}

export function writeText(relativePath, value) {
  const target = join(repoRoot, relativePath);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, value);
}

export function runCommand(command, args, options = {}) {
  const { logFile, ...spawnOptions } = options;
  const requestedStdio = options.stdio ?? 'pipe';
  const invocation = resolveInvocation(command, args);
  const result = spawnSync(invocation.command, invocation.args, {
    cwd: repoRoot,
    encoding: 'utf8',
    ...spawnOptions,
    stdio: logFile ? 'pipe' : requestedStdio,
  });

  if (logFile) {
    if (requestedStdio === 'inherit') {
      process.stdout.write(result.stdout ?? '');
      process.stderr.write(result.stderr ?? '');
    }

    writeFileSync(
      logFile,
      [
        `$ ${command} ${args.join(' ')}`,
        result.stdout ?? '',
        result.stderr ?? '',
      ].join('\n'),
    );
  }

  return result;
}

export function runRequired(command, args, options = {}) {
  console.log(`$ ${command} ${args.join(' ')}`);
  const result = runCommand(command, args, {
    stdio: options.capture ? 'pipe' : 'inherit',
    ...options,
  });

  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed with exit code ${result.status}`);
  }

  return result;
}

export function gitShowHead(relativePath) {
  try {
    return execFileSync('git', ['show', `HEAD:${relativePath}`], {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
  } catch {
    return null;
  }
}

export function hasGitDiff() {
  const result = runCommand('git', ['diff', '--quiet'], { stdio: 'ignore' });
  return result.status !== 0;
}

export function cleanNodeModules() {
  const nodeModules = join(repoRoot, 'node_modules');
  if (existsSync(nodeModules)) {
    rmSync(nodeModules, { recursive: true, force: true, maxRetries: 3 });
  }
}

export function collectRootDependencies(packageJson) {
  return {
    ...(packageJson.dependencies ?? {}),
    ...(packageJson.devDependencies ?? {}),
  };
}

export function dependencySection(packageJson, packageName) {
  if (packageJson.dependencies?.[packageName] !== undefined) {
    return 'dependencies';
  }

  if (packageJson.devDependencies?.[packageName] !== undefined) {
    return 'devDependencies';
  }

  return null;
}

export function getLockVersion(packageLock, packageName) {
  return packageLock.packages?.[`node_modules/${packageName}`]?.version ?? null;
}

export function npmBin(commandName) {
  return process.platform === 'win32'
    ? join(repoRoot, 'node_modules', '.bin', `${commandName}.cmd`)
    : join(repoRoot, 'node_modules', '.bin', commandName);
}

function resolveInvocation(command, args) {
  if (command === 'npm' || command === 'npx') {
    const npmCli = resolveNpmCli();
    if (!npmCli) {
      return { command, args };
    }

    return {
      command: process.execPath,
      args:
        command === 'npm'
          ? [npmCli, ...args]
          : [npmCli, 'exec', '--', ...args],
    };
  }

  return { command, args };
}

function resolveNpmCli() {
  const candidates = [process.env.npm_execpath, ...findNpmCmdCandidates()]
    .filter(Boolean)
    .map((candidate) => npmCliFromCandidate(candidate))
    .filter(Boolean)
    .filter((candidate) => existsSync(candidate))
    .filter((candidate) => !isInsideWorkspaceNodeModules(candidate));

  return candidates[0] ?? null;
}

function findNpmCmdCandidates() {
  if (process.platform !== 'win32') {
    return [];
  }

  const result = spawnSync('where.exe', ['npm.cmd'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  });

  if (result.status !== 0) {
    return [];
  }

  return result.stdout.split(/\r?\n/).filter(Boolean);
}

function npmCliFromCandidate(candidate) {
  if (candidate.endsWith('npm-cli.js')) {
    return candidate;
  }

  if (process.platform === 'win32' && candidate.toLowerCase().endsWith('npm.cmd')) {
    return join(dirname(candidate), 'node_modules', 'npm', 'bin', 'npm-cli.js');
  }

  return candidate;
}

function isInsideWorkspaceNodeModules(candidate) {
  const workspaceNodeModules = normalize(join(repoRoot, 'node_modules')).toLowerCase();
  return normalize(candidate).toLowerCase().startsWith(workspaceNodeModules);
}

export function parseVersion(version) {
  if (!version || version.includes('-')) {
    return null;
  }

  const match = /^(\d+)\.(\d+)\.(\d+)(?:[-+].*)?$/.exec(version ?? '');
  if (!match) {
    return null;
  }

  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    raw: version,
  };
}

export function compareVersions(left, right) {
  for (const key of ['major', 'minor', 'patch']) {
    if (left[key] !== right[key]) {
      return left[key] - right[key];
    }
  }

  return 0;
}

export function preserveRangePrefix(currentSpec, nextVersion) {
  const prefix = currentSpec.match(/^[~^]/)?.[0] ?? '';
  return `${prefix}${nextVersion}`;
}
