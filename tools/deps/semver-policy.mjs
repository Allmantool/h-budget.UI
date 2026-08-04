import {
	dependencyGroupFor,
	isAllowedMajorPackage,
	isAllowedMinorPackage,
	isBlockedAutomaticPackage,
} from './rules.mjs';

const VERSION = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?(?:\+([0-9A-Za-z.-]+))?$/;

export function parseStableVersion(value) {
	if (typeof value !== 'string') return null;
	const match = VERSION.exec(value.trim());
	if (!match || match[4]) return null;
	return { major: Number(match[1]), minor: Number(match[2]), patch: Number(match[3]), raw: value.trim() };
}

export function compareStableVersions(left, right) {
	return left.major - right.major || left.minor - right.minor || left.patch - right.patch;
}

export function isSupportedRange(value) {
	return typeof value === 'string' && /^(?:\^|~)?\d+\.\d+\.\d+(?:\+[0-9A-Za-z.-]+)?$/.test(value.trim());
}

export function preserveRangePrefix(range, version) {
	return `${range.trim().match(/^[~^]/)?.[0] ?? ''}${version}`;
}

export function candidateIsEligible(current, candidate, mode) {
	if (compareStableVersions(candidate, current) <= 0) return false;
	if (mode === 'patch') return candidate.major === current.major && candidate.minor === current.minor;
	if (mode === 'minor') return candidate.major === current.major;
	return mode === 'major';
}

export function policyDecision(name, mode, groups) {
	const group = dependencyGroupFor(name, groups);
	if (mode === 'major' && group?.manualMajor)
		return { allowed: false, reason: 'major update requires a specialized migration', group };
	if (isBlockedAutomaticPackage(name))
		return { allowed: false, reason: 'package blocked by automatic update policy', group };
	if (mode === 'minor' && !isAllowedMinorPackage(name))
		return { allowed: false, reason: 'package is not minor-eligible', group };
	if (mode === 'major' && !isAllowedMajorPackage(name))
		return { allowed: false, reason: 'package is not major-eligible', group };
	return { allowed: true, reason: null, group };
}

export function selectCandidate({
	name,
	section,
	spec,
	currentVersion,
	versions,
	mode,
	groups,
	metadataByVersion = {},
}) {
	if (!isSupportedRange(spec)) return { kind: 'skipped', name, reason: 'unsupported dependency specification' };
	const decision = policyDecision(name, mode, groups);
	if (!decision.allowed)
		return { kind: 'skipped', name, reason: decision.reason, group: decision.group?.name ?? null };
	const current = parseStableVersion(currentVersion);
	if (!current) return { kind: 'skipped', name, reason: 'locked version is not a stable semantic version' };
	const candidates = versions
		.map(parseStableVersion)
		.filter(Boolean)
		.filter(version => candidateIsEligible(current, version, mode))
		.filter(version => !metadataByVersion[version.raw]?.deprecated)
		.sort(compareStableVersions);
	const selected = candidates.at(-1);
	if (!selected)
		return {
			kind: 'skipped',
			name,
			reason: 'no eligible stable non-deprecated version',
			group: decision.group?.name ?? null,
		};
	return {
		kind: 'candidate',
		name,
		section,
		from: spec,
		fromVersion: current.raw,
		to: preserveRangePrefix(spec, selected.raw),
		toVersion: selected.raw,
		updateType: mode,
		currentMajor: current.major,
		currentMinor: current.minor,
		currentPatch: current.patch,
		targetMajor: selected.major,
		targetMinor: selected.minor,
		targetPatch: selected.patch,
		group: decision.group?.name ?? null,
		policyDecision: 'eligible',
		deprecated: false,
		engines: metadataByVersion[selected.raw]?.engines ?? null,
		peerDependencies: metadataByVersion[selected.raw]?.peerDependencies ?? null,
	};
}
