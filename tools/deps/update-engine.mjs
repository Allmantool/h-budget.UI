/**
 * Deterministic bulk-first dependency update algorithm. All effects are
 * injected so this module can be exercised without the public registry.
 */
export function createUpdateEngine(actions) {
	return {
		run(candidates) {
			const baseline = actions.snapshot();
			const units = createUnits(candidates);
			const bulk = attempt(actions, candidates, 'bulk');
			if (bulk.ok) return completed(candidates, [], 'bulk', bulk);

			actions.restore(baseline);
			const accepted = [];
			const rejected = [];
			for (const unit of units) {
				const snapshot = actions.snapshot();
				const result = attempt(actions, unit.candidates, `unit-${unit.name}`);
				if (result.ok) {
					accepted.push(...unit.candidates);
				} else {
					actions.restore(snapshot);
					rejected.push(
						...unit.candidates.map(candidate => ({
							...candidate,
							reason: result.reason,
							failedStage: result.stage,
						}))
					);
				}
			}

			if (accepted.length === 0) {
				const restored = actions.restore(baseline);
				return {
					status: restored ? 'completed-with-rejections' : 'failed',
					accepted,
					rejected,
					validation: bulk,
					rollback: restored,
				};
			}

			const finalValidation = actions.validate('final-accumulated');
			if (!finalValidation.ok) {
				const restored = actions.restore(baseline);
				return {
					status: restored ? 'rolled-back' : 'failed',
					accepted: [],
					rejected: candidates.map(candidate => ({
						...candidate,
						reason: 'final accumulated validation failed',
						failedStage: finalValidation.stage,
					})),
					validation: finalValidation,
					rollback: restored,
				};
			}
			return completed(accepted, rejected, 'fallback', finalValidation);
		},
	};
}

function createUnits(candidates) {
	const byGroup = new Map();
	for (const candidate of [...candidates].sort((left, right) => left.name.localeCompare(right.name))) {
		const key = candidate.group ? `group:${candidate.group}` : `package:${candidate.name}`;
		const unit = byGroup.get(key) ?? { name: candidate.group ?? candidate.name, candidates: [] };
		unit.candidates.push(candidate);
		byGroup.set(key, unit);
	}
	return [...byGroup.values()].sort((left, right) => left.name.localeCompare(right.name));
}

function attempt(actions, candidates, label) {
	actions.apply(candidates);
	const resolution = actions.resolve(label);
	if (!resolution.ok) return resolution;
	const lock = actions.verifyLock(candidates);
	if (!lock.ok) return lock;
	return actions.validate(label);
}

function completed(accepted, rejected, strategy, validation) {
	return {
		status: rejected.length ? 'completed-with-rejections' : 'completed',
		accepted,
		rejected,
		strategy,
		validation,
		rollback: null,
	};
}
