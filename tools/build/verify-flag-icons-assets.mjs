import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = dirname(dirname(dirname(fileURLToPath(import.meta.url))));

const project = readJson('project.json');
const buildOptions = project.targets?.build?.options;
const testOptions = project.targets?.test?.options;
const assets = buildOptions?.assets ?? [];
const styles = buildOptions?.styles ?? [];
const testStyles = testOptions?.styles ?? [];
const failures = [];

verifyAssetConfig();
verifyProcessedStyles();
verifyIndexStylesheet();
verifyBuiltArtifacts();
verifyCssReferences();
verifyRepresentativeSourceMarkup();

if (failures.length > 0) {
	console.error('Flag-icons asset verification failed:');
	for (const failure of failures) {
		console.error(`- ${failure}`);
	}
	process.exit(1);
}

console.log('Flag-icons asset verification passed.');

function verifyAssetConfig() {
	expectAssetEntry('node_modules/flag-icons/css', '*.css', 'assets/vendor/flag-icons/css');
	expectAssetEntry('node_modules/flag-icons/flags/4x3', '**/*.svg', 'assets/vendor/flag-icons/flags/4x3');
	expectAssetEntry('node_modules/flag-icons/flags/1x1', '**/*.svg', 'assets/vendor/flag-icons/flags/1x1');
}

function verifyProcessedStyles() {
	for (const [name, styleList] of [
		['build styles', styles],
		['test styles', testStyles],
	]) {
		const processedFlagStyle = styleList.find(style => String(style).includes('flag-icons'));

		if (processedFlagStyle) {
			failures.push(`${name} still process flag-icons through Angular styles: ${processedFlagStyle}`);
		}
	}
}

function verifyIndexStylesheet() {
	const indexHtml = readText('src/index.html');
	const expectedHref = 'assets/vendor/flag-icons/css/flag-icons.min.css';

	if (!indexHtml.includes(`href="${expectedHref}"`)) {
		failures.push(`src/index.html does not reference ${expectedHref}.`);
	}

	if (indexHtml.includes('href="/assets/vendor/flag-icons')) {
		failures.push('src/index.html uses a root-absolute flag-icons URL instead of a base-href relative URL.');
	}
}

function verifyBuiltArtifacts() {
	const requiredFiles = [
		'dist/h-budget/browser/assets/vendor/flag-icons/css/flag-icons.min.css',
		'dist/h-budget/browser/assets/vendor/flag-icons/flags/4x3/us.svg',
		'dist/h-budget/browser/assets/vendor/flag-icons/flags/4x3/by.svg',
		'dist/h-budget/browser/assets/vendor/flag-icons/flags/1x1/us.svg',
		'dist/h-budget/browser/assets/vendor/flag-icons/flags/1x1/by.svg',
	];

	for (const filePath of requiredFiles) {
		if (!existsSync(abs(filePath))) {
			failures.push(`Missing built flag-icons artifact: ${filePath}`);
		}
	}
}

function verifyCssReferences() {
	const cssPath = 'dist/h-budget/browser/assets/vendor/flag-icons/css/flag-icons.min.css';

	if (!existsSync(abs(cssPath))) {
		return;
	}

	const css = readText(cssPath);
	const requiredSnippets = [
		'.fi-us{background-image:url(../flags/4x3/us.svg)}',
		'.fi-us.fis{background-image:url(../flags/1x1/us.svg)}',
	];

	for (const snippet of requiredSnippets) {
		if (!css.includes(snippet)) {
			failures.push(`Copied flag-icons CSS is missing expected rule: ${snippet}`);
		}
	}

	const urls = [...css.matchAll(/url\(([^)]+)\)/g)].map(match => match[1].replaceAll('"', '').replaceAll("'", ''));
	const missingUrls = urls
		.map(url => normalize(join(abs('dist/h-budget/browser/assets/vendor/flag-icons/css'), url)))
		.filter(filePath => !existsSync(filePath))
		.slice(0, 10);

	if (missingUrls.length > 0) {
		failures.push(`Copied flag-icons CSS references missing files: ${missingUrls.join(', ')}`);
	}
}

function verifyRepresentativeSourceMarkup() {
	const paymentAccountTemplate = readText(
		'src/presentation/accounting/components/payment-account/payment-account.component.html'
	);

	if (!paymentAccountTemplate.includes('class="abbreviation-flag fi fi-{{')) {
		failures.push('Representative normal flag markup was not found in payment-account.component.html.');
	}
}

function expectAssetEntry(input, glob, output) {
	const found = assets.some(
		asset =>
			typeof asset === 'object' &&
			asset.input === input &&
			asset.glob === glob &&
			asset.output === output
	);

	if (!found) {
		failures.push(`Missing asset copy entry: input=${input}, glob=${glob}, output=${output}`);
	}
}

function readJson(filePath) {
	return JSON.parse(readText(filePath));
}

function readText(filePath) {
	return readFileSync(abs(filePath), 'utf8');
}

function abs(filePath) {
	return join(repoRoot, filePath);
}
