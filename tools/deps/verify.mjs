import { existsSync } from 'node:fs';
import {
  cleanNodeModules,
  ensureWorkDirs,
  npmBin,
  readJson,
  runRequired,
} from './common.mjs';

const allowFrameworkUpdates = process.argv.includes('--allow-framework-updates');
const packageJson = readJson('package.json');

ensureWorkDirs();

const commandsRun = [
  'npm ci',
  `npm run deps:guard${allowFrameworkUpdates ? ' -- --allow-framework-updates' : ''}`,
  'npx tsc -p tsconfig.app.json --noEmit',
  'npm run lint',
  'npm run test:ci',
  'npm run build:prod',
];

if (packageJson.scripts?.['format:check']) {
  commandsRun.push('npm run format:check');
}

if (existsSync(npmBin('nx'))) {
  commandsRun.push('npx nx affected --target=build --uncommitted --configuration=production');
}

console.log('Running clean dependency verification.');
cleanNodeModules();
runRequired('npm', ['ci']);
runRequired('npm', ['run', 'deps:guard', ...(allowFrameworkUpdates ? ['--', '--allow-framework-updates'] : [])]);
runRequired('npx', ['tsc', '-p', 'tsconfig.app.json', '--noEmit']);
runRequired('npm', ['run', 'lint']);
runRequired('npm', ['run', 'test:ci']);
runRequired('npm', ['run', 'build:prod']);

if (packageJson.scripts?.['format:check']) {
  runRequired('npm', ['run', 'format:check']);
}

if (existsSync(npmBin('nx'))) {
  runRequired('npx', ['nx', 'affected', '--target=build', '--uncommitted', '--configuration=production']);
}

console.log('Dependency verification passed.');
console.log(`Verification commands:\n${commandsRun.map((command) => `- ${command}`).join('\n')}`);
