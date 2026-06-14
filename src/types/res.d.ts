export type ResolutionClause = {
	id: number;
	lits: string[];
	parents: number[];
};

export type ResolutionDerivation = {
	clauses: ResolutionClause[];
	success: boolean;
	msg: string;
};
