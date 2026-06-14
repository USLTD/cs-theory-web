// import type { ResolutionClause, ResolutionDerivation } from "#types/res";

/**
 * @typedef ResolutionClause {import("#types/res").ResolutionClause}
 * @typedef ResolutionDerivation {import("#types/res").ResolutionDerivation}
 */

/**
 *
 * @param raw {string}
 * @returns {`~${string}`|string}
 */
function normalizeLiteral(raw) {
	const literal = raw.trim();
	if (!literal) {
		throw new Error("Empty literal found inside a clause.");
	}
	if (literal.includes(" ")) {
		throw new Error(
			`Invalid literal "${literal}". Use compact propositional symbols without spaces.`,
		);
	}

	const negatedPrefix = literal.match(/^~+/)?.[0] ?? "";
	const base = literal.slice(negatedPrefix.length);
	if (!base) {
		throw new Error(`Invalid literal "${literal}". Missing variable name.`);
	}

	if (!/^[A-Za-z][A-Za-z0-9_]*$/.test(base)) {
		throw new Error(
			`Invalid literal "${literal}". Use a single propositional symbol, optionally prefixed by "~".`,
		);
	}

	return negatedPrefix.length % 2 === 1 ? `~${base}` : base;
}

/**
 * @param lits {string[]}
 * @returns {string}
 */
function canonicalHash(lits) {
	return [...new Set(lits)].sort().join("|");
}

/**
 * @param lits {string[]}
 * @returns {boolean}
 */
function isTautology(lits) {
	for (let i = 0; i < lits.length; i++) {
		const lit = lits[i];
		const complement = lit.startsWith("~") ? lit.slice(1) : `~${lit}`;
		if (lits.includes(complement)) return true;
	}
	return false;
}

/**
 * @param clausesInput {string}
 * @returns {string[]}
 */
function parseClauseInput(clausesInput) {
	const clauses = clausesInput
		.split(",")
		.map((s) => s.trim())
		.filter(Boolean);

	if (clauses.length === 0) {
		throw new Error("Please enter at least one clause.");
	}

	return clauses;
}

self.onmessage = (e) => {
	const data = e.data;
	if (data.type !== "RUN_RESOLUTION") return;

	const { id, clausesInput } = data;

	try {
		const rawClauses = parseClauseInput(clausesInput);

		/** @type {ResolutionClause[]} */
		const clauses = [];
		/** @type {Set<string>} */
		const seen = new Set();
		let nextId = 1;

		for (const raw of rawClauses) {
			const literals = raw
				.split("|")
				.map((lit) => normalizeLiteral(lit))
				.filter(Boolean);

			const normalized = [...new Set(literals)];
			if (normalized.length === 0) {
				console.error(new Error(`Clause "${raw}" is empty.`));
			}

			if (isTautology(normalized)) {
				continue;
			}

			const hash = canonicalHash(normalized);
			if (seen.has(hash)) continue;
			seen.add(hash);
			clauses.push({ id: nextId++, lits: normalized, parents: [] });
		}

		if (clauses.length === 0) {
			console.error(
				new Error(
					"All clauses were tautologies. No proof search was necessary.",
				),
			);
		}

		const maxIterations = 5000; // Increased safety limit due to massive efficiency gain
		let iterations = 0;
		let foundContradiction = false;
		let currentIdx = 0; // Given-Clause pointer

		// Complete and Non-redundant Given-Clause Loop
		while (
			currentIdx < clauses.length &&
			!foundContradiction &&
			iterations < maxIterations
		) {
			iterations++;
			const left = clauses[currentIdx];

			// Only compare the current clause against previously processed clauses
			for (let j = 0; j < currentIdx; j++) {
				const right = clauses[j];

				for (const lit of left.lits) {
					const complement = lit.startsWith("~") ? lit.slice(1) : `~${lit}`;
					if (!right.lits.includes(complement)) continue;

					// Efficient unique merge without allocating a full Set
					const resArr = [];
					for (const l of left.lits) if (l !== lit) resArr.push(l);
					for (const l of right.lits)
						if (l !== complement && !resArr.includes(l)) resArr.push(l);

					if (isTautology(resArr)) continue;

					const hash = canonicalHash(resArr);
					if (seen.has(hash)) continue;

					seen.add(hash);

					/** @type {ResolutionClause} */
					const newClause = {
						id: nextId++,
						lits: resArr,
						parents: [left.id, right.id],
					};
					clauses.push(newClause);

					if (resArr.length === 0) {
						foundContradiction = true;
						break;
					}
				}

				if (foundContradiction) break;
			}

			currentIdx++; // Move pointer forward
		}

		self.postMessage({
			id,
			/** @type {ResolutionDerivation} */
			result: {
				clauses: clauses,
				success: foundContradiction,
				msg: foundContradiction
					? "Contradiction found. The clause set is unsatisfiable."
					: iterations >= maxIterations
						? "Search stopped at the safety limit. The set is not proven unsatisfiable."
						: "Saturated without contradiction. The clause set appears satisfiable.",
			},
		});
	} catch (err) {
		self.postMessage({
			id,
			error: err instanceof Error ? err.message : String(err),
		});
	}
};
