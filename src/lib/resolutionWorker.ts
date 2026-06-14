import type { ResolutionClause, ResolutionDerivation } from "#/types/res";

type ClauseLike = {
	id: number;
	lits: string[];
	parents: number[];
};

function normalizeLiteral(raw: string): string {
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

function canonicalHash(lits: string[]): string {
	return [...new Set(lits)].sort().join("|");
}

function isTautology(lits: string[]): boolean {
	const set = new Set(lits);
	for (const lit of set) {
		const complement = lit.startsWith("~") ? lit.slice(1) : `~${lit}`;
		if (set.has(complement)) return true;
	}
	return false;
}

function parseClauseInput(clausesInput: string): string[] {
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
		const clauses: ClauseLike[] = [];
		const seen = new Set<string>();
		let nextId = 1;

		for (const raw of rawClauses) {
			const literals = raw
				.split("|")
				.map((lit: string) => normalizeLiteral(lit))
				.filter(Boolean);

			const normalized = [...new Set(literals)];
			if (normalized.length === 0) {
				throw new Error(`Clause "${raw}" is empty.`);
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
			throw new Error(
				"All clauses were tautologies. No proof search was necessary.",
			);
		}

		const maxIterations = 1000;
		let iterations = 0;
		let changed = true;
		let foundContradiction = false;

		while (changed && !foundContradiction && iterations < maxIterations) {
			iterations++;
			changed = false;
			const currentLen = clauses.length;

			for (let i = 0; i < currentLen; i++) {
				for (let j = i + 1; j < currentLen; j++) {
					const left = clauses[i];
					const right = clauses[j];

					for (const lit of left.lits) {
						const complement = lit.startsWith("~") ? lit.slice(1) : `~${lit}`;
						if (!right.lits.includes(complement)) continue;

						const resolvent = new Set([...left.lits, ...right.lits]);
						resolvent.delete(lit);
						resolvent.delete(complement);

						const resArr = [...resolvent];
						if (isTautology(resArr)) continue;

						const hash = canonicalHash(resArr);
						if (seen.has(hash)) continue;

						seen.add(hash);
						const newClause: ClauseLike = {
							id: nextId++,
							lits: resArr,
							parents: [left.id, right.id],
						};
						clauses.push(newClause);
						changed = true;

						if (resArr.length === 0) {
							foundContradiction = true;
							break;
						}
					}

					if (foundContradiction) break;
				}
				if (foundContradiction) break;
			}
		}

		self.postMessage({
			id,
			result: {
				clauses: clauses as ResolutionClause[],
				success: foundContradiction,
				msg: foundContradiction
					? "Contradiction found. The clause set is unsatisfiable."
					: iterations >= maxIterations
						? "Search stopped at the safety limit. The set is not proven unsatisfiable."
						: "Saturated without contradiction. The clause set appears satisfiable.",
			} satisfies ResolutionDerivation,
		});
	} catch (err) {
		self.postMessage({
			id,
			error: err instanceof Error ? err.message : String(err),
		});
	}
};
